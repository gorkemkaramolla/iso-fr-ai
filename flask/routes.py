import base64
import datetime
import glob
import json
import logging
import shutil
import bson
import bson.json_util
from flask import Flask, Blueprint, request, jsonify, Response, send_file, send_from_directory, abort
import flask.json.provider as provider
from pymongo import ASCENDING, DESCENDING, MongoClient
from services.camera_processor.Stream import Stream
from services.speaker_diarization import SpeakerDiarizationProcessor
from services.system_monitoring import SystemMonitoring
# from services.camera_processor.camera_processor import CameraProcessor
from services.camera_processor.enums.camera import Camera
# from services.elastic_search import ElasticSearcher
from logger import configure_logging
from flask_cors import CORS
from auth.auth_provider import AuthProvider
from flask_jwt_extended import jwt_required, JWTManager
import os
from datetime import timedelta
from bson.objectid import ObjectId
from PIL import Image
import io
import binascii
import cv2
import numpy as np
from socketio_instance import notify_new_camera_url, socketio
from config import BINARY_MATCH

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False

CORS(app, origins="*")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(minutes=2)

# jwt = JWTManager(app)

###################################################### Setup MongoDB
client = MongoClient(os.environ.get("MONGO_DB_URI"))
db = client[os.environ.get("MONGO_DB_NAME")]
logs_collection = db["logs"]
camera_collection = db["cameras"]
#######################################################Setup ElasticSearch
# es_host = os.environ.get("ES_HOST")
# searcher = ElasticSearcher(client, db, es_host)

###################################################### Create an instance of your class
diarization_processor = SpeakerDiarizationProcessor(device="cuda")
# camera_processor = CameraProcessor(device="cuda")
stream_instance = Stream(device="cuda")
logger = configure_logging()
system_monitoring_instance = SystemMonitoring()


# Setup Blueprint
audio_bp = Blueprint("audio_bp", __name__)
camera_bp = Blueprint("camera_bp", __name__)
system_check = Blueprint("system_check", __name__)
auth_bp = Blueprint("auth_bp", __name__)
elastic_search_bp = Blueprint("elastic_search_bp", __name__)
users_bp = Blueprint("users_bp", __name__)



#########################################################
@users_bp.route("/users/images", methods=["GET"])
def get_user_images():
    personel = list(
        db.get_collection("Personel").find(
            {}, {"FOTO_BINARY_DATA": 1, "ADI": 1, "SOYADI": 1}
        )
    )
    for i, person in enumerate(personel):
        try:
            if (
                person.get("FOTO_BINARY_DATA")
                and person.get("FOTO_BINARY_DATA") != BINARY_MATCH
            ):
                hex_data = person.get("FOTO_BINARY_DATA")
                binary_data = binascii.unhexlify(hex_data)
                nparr = np.frombuffer(binary_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if not os.path.exists("images"):
                    os.makedirs("images")
                adi = person.get("ADI", "unknown")
                soyadi = person.get("SOYADI", "unknown")
                cv2.imwrite(f"images/{adi}{soyadi}.jpeg", image)
        except Exception as e:
            print(f"Image {i} is corrupted, skipping... Error: {str(e)}")
            continue
    return "Images saved", 200


@users_bp.route("/users", methods=["GET"])
def get_users():
    personel = list(db.get_collection("Personel").find())
    for person in personel:
        person.pop("_id", None)  # Remove _id from the dictionary
    return jsonify(personel), 200


app.register_blueprint(users_bp)


auth_provider = AuthProvider()


@auth_bp.route("/token/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():

    # resp.set_cookie('access_token', new_token, httponly=True, secure=True,
    #                 expires=datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    access_token = auth_provider.refresh_token()
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    response = auth_provider.register(username, password)
    return response


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    tokens = auth_provider.login(username, password)
    return jsonify(tokens), 200


app.register_blueprint(auth_bp)

#########################CAMERA ROUTES###############################################

# ####################################################### Video Records


VIDEO_FOLDER = './records'

@camera_bp.route('/videos/<filename>')
def get_video(filename):
    
    file_path = os.path.join(VIDEO_FOLDER, filename)

    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=False)
    else:
        abort(404, description="Resource not found")


@camera_bp.route('/videos')
def list_videos():
    files = os.listdir(VIDEO_FOLDER)
    videos = [{'filename': file, 'title': file} for file in files if file.endswith(('.mp4'))]
    return jsonify(videos)



@camera_bp.route("/camera-url", methods=["POST"])
# @jwt_required()
def add_camera_url():
    data = request.json
    label = data.get("label")
    url = data.get("url")
    if not label or not url:
        return jsonify({"error": "Label and URL are required"}), 400
    camera = {"label": label, "url": url}
    result = camera_collection.insert_one(camera)
    # Convert ObjectId to string
    camera["_id"] = str(result.inserted_id)
    # Emit the new camera data
    notify_new_camera_url(camera=camera)
    return jsonify({"message": "Camera URL added successfully"}), 200


@camera_bp.route("/camera-urls", methods=["GET"])
# @jwt_required()
def get_camera_urls():
    cameras = list(camera_collection.find({}))
    print(cameras)
    return bson.json_util.dumps(cameras), 200


@camera_bp.route("/camera-url/<label>", methods=["DELETE"])
# @jwt_required()
def delete_camera_url(label):
    result = camera_collection.delete_one({"label": label})

    if result.deleted_count == 0:
        return jsonify({"error": "Camera label not found"}), 404

    return jsonify({"message": "Camera URL deleted successfully"}), 200


@camera_bp.route("/camera-url/<label>", methods=["PUT"])
# @jwt_required()
def update_camera_url(label):
    data = request.json
    new_label = data.get("label")
    new_url = data.get("url")
    if not new_label or not new_url:
        return jsonify({"error": "Label and URL are required"}), 400

    result = camera_collection.update_one(
        {"label": label}, {"$set": {"label": new_label, "url": new_url}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Camera label not found"}), 404

    return jsonify({"message": "Camera URL updated successfully"}), 200


# ****************************************************************************
@camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# @jwt_required()
def stream(stream_id):
    is_recording = request.args.get("is_recording") == "true"
    camera = request.args.get("camera")
    quality = request.args.get("quality")
    return Response(
        stream_instance.recog_face_ip_cam(
            stream_id,
            camera=camera,
            quality=quality,
            is_recording=is_recording,
        ),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@camera_bp.route("/stream/start/<int:stream_id>", methods=["POST"])
def start_stream(stream_id):
    is_recording = request.args.get("is_recording") == "true"
    camera = request.args.get("camera")
    quality = request.args.get("quality")

    # Start the stream if it's not already running
    stream_instance.start_stream(
        stream_id,
        camera=camera,
        quality=quality,
        is_recording=is_recording
    )

    return jsonify({"message": "Stream started successfully"}), 200

@camera_bp.route("/stream/stop/<int:stream_id>", methods=["POST"])
def stop_stream(stream_id):
    stream_instance.stop_stream(stream_id)
    return jsonify({"message": "Stream stopped successfully"}), 200

# ****************************************************************************
# Local CAM Stream
@socketio.on('video_frame')
def handle_video_frame(data):
    frame_data = data['frame']
    is_recording = data['isRecording']

    # Decode the image
    image_data = frame_data.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Process the image
    processed_image = stream_instance.recog_face_local_cam(img, is_recording)

    # Emit the processed frame back to the client
    socketio.emit('processed_frame', processed_image)

# ****************************************************************************

@camera_bp.route("/recog", methods=["GET"])
def get_all_logs():
    logs = list(
        logs_collection.find({}, {}).sort("timestamp", DESCENDING)
    )  # Exclude _id from the results
    return bson.json_util.dumps(logs)
    # return "Hello"


@camera_bp.route("/recog/<id>", methods=["GET"])
def get_log(id):
    log = logs_collection.find_one({"_id": ObjectId(id)})
    if log:
        return jsonify(log)
    else:
        return jsonify({"error": "Log not found"}), 404


@camera_bp.route("/recog/<id>", methods=["PUT"])
def update_log(id):
    data = request.json
    logs_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
    return jsonify({"message": "Log updated successfully"}), 200


@camera_bp.route("/recog/<id>", methods=["DELETE"])
def delete_log(id):
    logs_collection.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Log deleted successfully"}), 200


# @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# def update_recog_name(id):
#     data = request.json
#     new_name = data.get("name")
#     if not new_name:
#         return jsonify({"error": "Name is required"}), 400

#     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
#     if result.matched_count == 0:
#         return jsonify({"error": "Log not found"}), 404

#     return jsonify({"message": "Name updated successfully"}), 200


@camera_bp.route("/recog/name/<id>", methods=["PUT"])
def update_recog_name(id):
    data = request.json
    new_name = data.get("name")
    if not new_name:
        return jsonify({"error": "Name is required"}), 400

    # Update the label in the database
    result = stream_instance.recognition_logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
    if result.matched_count == 0:
        return jsonify({"error": "Log not found"}), 404
  
    # Determine the correct source folder path
    base_dir = os.path.join('recog')
    unknown_faces_path = os.path.join(base_dir, 'unknown_faces', id)
    known_faces_path = os.path.join(base_dir, 'known_faces', new_name)
    face_images_path = './face-images'

    try:
        # Ensure known_faces/<name> directory exists
        if not os.path.exists(known_faces_path):
            os.makedirs(known_faces_path)

        moved_files = []

        # Rename and move files from old folder to the appropriate directories
        for file_name in os.listdir(unknown_faces_path):
            if file_name.endswith((".jpg", ".png", ".jpeg")):
                # Construct the new file name as <new_name>-<id>.jpeg for known_faces
                new_known_faces_file_name = f"{new_name}-{id}.jpeg"
                known_faces_dst_path = os.path.join(known_faces_path, new_known_faces_file_name)

                # Construct the new file name as <new_name>.jpeg for face-images
                new_face_images_file_name = f"{new_name}.jpeg"
                face_images_dst_path = os.path.join(face_images_path, new_face_images_file_name)
                
                # Check if a file with the same name already exists in face-images
                existing_files = [
                    f for f in os.listdir(face_images_path)
                    if os.path.splitext(f)[0] == new_name and f.endswith((".jpg", ".png", ".jpeg"))
                ]
                
                if existing_files:
                    print(f"File with the name '{new_name}' already exists in face-images. Skipping file.")
                    continue  # Skip this file as a similar file exists
                
                src_file_path = os.path.join(unknown_faces_path, file_name)
                
                # Move the file to the known_faces directory with the new name
                shutil.move(src_file_path, known_faces_dst_path)
                moved_files.append((new_known_faces_file_name, known_faces_dst_path))

                # Also move the file to the face-images directory
                shutil.copy(known_faces_dst_path, face_images_dst_path)
        
        # Call update_database with old_name (id) and new_name
        stream_instance.update_database(id, new_name)

        # Remove the old folder if it's empty
        if not os.listdir(unknown_faces_path):
            os.rmdir(unknown_faces_path)

        # Update the image paths in the database
        for new_file_name, new_path in moved_files:
            stream_instance.recognition_logs_collection.update_many(
                {"label": new_name},
                {
                    "$set": {
                        "image_path": new_path
                    }
                }
            )
    except FileNotFoundError:
        return jsonify({"error": "Folder not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Name, image paths updated, and images moved successfully"}), 200

# -----------------------------------Çalışan Kod




@camera_bp.route("/images/<path:image_path>", methods=["GET"])
def get_image(image_path):
    full_path = os.path.join(os.getcwd(), image_path)
    try:
        return send_file(full_path, mimetype="image/jpeg")
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404


@camera_bp.route("/faces/<image_name>", methods=["GET"])
def get_face_image(image_name):
    # Define the directory to search in and the possible extensions
    search_dir = os.path.join(os.getcwd(), "face-images")
    print("------" + search_dir)
    extensions = ['jpg', 'jpeg', 'png']
    
    # Search for files matching the image name with any of the extensions
    for ext in extensions:
        file_pattern = os.path.join(search_dir, f"{image_name}.{ext}")
        matching_files = glob.glob(file_pattern)
        if matching_files:
            # If a match is found, send the first matching file
            return send_file(matching_files[0], mimetype="image/jpeg")
    
    # If no file matches, return an error message
    return jsonify({"error": "Image not found"}), 404


# @camera_bp.route("/camera/<int:cam_id>", methods=["GET"])
# # @jwt_required()
# def local_camera(cam_id):

#     return Response(
#         camera_processor.local_camera_stream(cam_id, request.args.get("quality")),
#         mimetype="multipart/x-mixed-replace; boundary=frame",
#     )


app.register_blueprint(camera_bp)


# ----------------------------
# # Start the thread to send system info
@app.route("/system_check/", methods=["GET"])
@jwt_required()
def system_check_route():
    system_info = system_monitoring_instance.send_system_info()
    return jsonify(system_info)


## START TRANSCRIPTION ROUTES
active_requests = {}


@audio_bp.route("/process-audio/", methods=["POST"])
@jwt_required()
def process_audio_route():
    client_id = request.headers.get("X-Client-ID")
    if not client_id:
        return jsonify({"error": "Client ID is required"}), 400

    if client_id in active_requests:
        return jsonify({"error": "Another process is still running"}), 429

    active_requests[client_id] = True
    try:
        response = diarization_processor.process_audio(client_id)
        return response
    finally:
        del active_requests[
            client_id
        ]  # Ensure to clear the flag irrespective of success or failure


@audio_bp.route("/transcriptions/", defaults={"id": None}, methods=["GET"])
@audio_bp.route("/transcriptions/<id>", methods=["GET"])
@jwt_required()
def get_transcription_route(id):
    if id is None:

        response = diarization_processor.get_all_transcriptions()
        print(str(response))
    else:
        # Get transcription with the specified id
        response = diarization_processor.get_transcription(id)
    return response


@audio_bp.route(
    "/rename_segments/<transcription_id>/<old_name>/<new_name>", methods=["POST"]
)
@jwt_required()
def rename_segments_route(transcription_id, old_name, new_name):
    result, status_code = diarization_processor.rename_segments(
        transcription_id, old_name, new_name
    )
    return jsonify(result), status_code


app.register_blueprint(audio_bp)

# ----------------------------Run the app
# if __name__ == "__main__":
#     app.run(debug=True, threaded=True, port=5004)
import requests

def get_personel_data():
    url = "http://localhost:5004/personel"
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()  # Return the JSON response
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None

# Example usage
if __name__ == "__main__":
    data = get_personel_data()
    print(data)
    if data:
        print(data)
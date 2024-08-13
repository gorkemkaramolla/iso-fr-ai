import base64
import glob
import shutil
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
import bson
import bson.json_util
from flask import Flask, Blueprint, request, jsonify, Response, send_file, abort
import flask.json.provider as provider
from pymongo import DESCENDING, MongoClient
from services.camera_processor.Stream import Stream
from logger import configure_logging
from flask_cors import CORS
from flask_jwt_extended import jwt_required, JWTManager
import os
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import cv2
import numpy as np
from socketio_instance import notify_new_camera_url, socketio, emit, join_room, leave_room
import logging
import pytz
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False

CORS(app, origins="*")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

# jwt = JWTManager(app)

###################################################### Setup MongoDB
# Get environment variables
mongo_db_uri = os.getenv("MONGO_DB_URI")
mongo_db_name = os.getenv("MONGO_DB_NAME")

# Debug prints to check environment variable values
print(f"MONGO_DB_URI: {mongo_db_uri}")
print(f"MONGO_DB_NAME: {mongo_db_name}")

# Ensure environment variables are set
if not mongo_db_uri or not mongo_db_name:
    raise ValueError("MONGO_DB_URI and MONGO_DB_NAME environment variables must be set")

# Initialize MongoDB client and collections
client = MongoClient(mongo_db_uri)
db = client[mongo_db_name]
logs_collection = db["logs"]
camera_collection = db["cameras"]

###################################################### Create an instance of your class
# camera_processor = CameraProcessor(device="cuda")
stream_instance = Stream(device="cuda")
logger = configure_logging()

# Setup Blueprint
camera_bp = Blueprint("camera_bp", __name__)


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
# @camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# # @jwt_required()
# def stream(stream_id):
#     is_recording = request.args.get("is_recording") == "true"
#     camera = request.args.get("camera")

#     print("------------- Route-Camera: ", camera)
#     resolution = request.args.get("resolution")
#     print("------------- Route-Resolution: ", resolution)
#     quality = request.args.get("streamProfile")
#     print("------------- Route-Quality: ", quality)


#     return Response(
#         stream_instance.recog_face_ip_cam(
#             stream_id,
#             camera=camera,
#             quality=quality,
#             is_recording=is_recording,
#         ),
#         mimetype="multipart/x-mixed-replace; boundary=frame",
#     )
@camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# @jwt_required()
def stream(stream_id):
    is_recording = request.args.get("is_recording") == "true"
    camera = request.args.get("camera")
    quality = request.args.get("streamProfile")

    print("------------- Route-Camera: ", camera)
    print("------------- Route-Quality: ", quality)

    # Parse the camera URL
    parsed_url = urlparse(camera)
    query_params = parse_qs(parsed_url.query)

    # Adjust the resolution and compression based on the quality parameter
    if quality == "Quality":
        query_params["resolution"] = ["1920x1080"]
        query_params["compression"] = ["20"]
    elif quality == "Balanced":
        query_params["resolution"] = ["1280x720"]
        query_params["compression"] = ["50"]
    elif quality == "Bandwidth":
        query_params["resolution"] = ["1280x720"]
        query_params["compression"] = ["75"]
    elif quality == "Mobile":
        query_params["resolution"] = ["800x450"]
        query_params["compression"] = ["75"]

    # Reconstruct the camera URL with updated query parameters
    new_query_string = urlencode(query_params, doseq=True)
    new_camera_url = urlunparse(parsed_url._replace(query=new_query_string))

    print("------------- Updated Camera URL: ", new_camera_url)

    return Response(
        stream_instance.recog_face_ip_cam(
            stream_id,
            camera=new_camera_url,
            is_recording=is_recording,
        ),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@camera_bp.route("/stream/start/<int:stream_id>", methods=["POST"])
def start_stream(stream_id):
    is_recording = request.args.get("is_recording") == "true"
    camera = request.args.get("camera")
    quality = request.args.get("streamProfile")

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
@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('joined', {'room': room}, room=room)

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)
    emit('left', {'room': room}, room=room)
# @socketio.on('video_frames')
# def handle_video_frames(data):
#     room = data['room']
#     frames_data = data['frames']
#     is_recording = data['isRecording']

#     processed_frames = []
#     for frame_data in frames_data:
#         image_data = frame_data.split(',')[1]
#         nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
#         img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#         processed_image = stream_instance.recog_face_local_cam(room, img, is_recording)
#         processed_frames.append(processed_image)

#     emit('processed_frames', {'frames': processed_frames}, room=room)

@socketio.on('video_frames')
def handle_video_frames(data):
    room = data['room']
    frames_data = data['frames']  # List of frames
    is_recording = data['isRecording']

    processed_frames = []

    for frame_data in frames_data:
        # Decode the image
        image_data = frame_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Process the image
        processed_image = stream_instance.recog_face_local_cam(img, is_recording)
        processed_frames.append(processed_image)

    # Emit the processed frames back to the room
    emit('processed_frames', {'frames': processed_frames}, room=room)

@camera_bp.route("/local_stream/stop_recording", methods=["POST"])
def stop_recording():
    return Response(
        stream_instance.stop_recording(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )
# ****************************************************************************

# @camera_bp.route("/recog", methods=["GET"])
# def get_all_logs():
#     logs = list(
#         logs_collection.find({}, {}).sort("timestamp", DESCENDING)
#     )  # Exclude _id from the results
#     return bson.json_util.dumps(logs)
    # return "Hello"
    
@camera_bp.route("/recog", methods=["GET"])
def get_all_logs_by_date():
    date_str = request.args.get('date')
    
    query = {}
    if date_str:
        try:
            # Parse the date string in ISO 8601 format
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            # Adjust for the timezone UTC+3
            tz = pytz.timezone('Etc/GMT-3')
            date = date.astimezone(tz)
            # Set the start and end of the day
            start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            # Convert to milliseconds since epoch for MongoDB comparison
            start_of_day_ms = int(start_of_day.timestamp() * 1000)
            end_of_day_ms = int(end_of_day.timestamp() * 1000)
            query['timestamp'] = {'$gte': start_of_day_ms, '$lt': end_of_day_ms}
        except ValueError:
            return "Invalid date format. Use ISO 8601 format.", 400

    logs = list(
        logs_collection.find(query, {}).sort("timestamp", DESCENDING)
    )  # Exclude _id from the results
    return bson.json_util.dumps(logs)




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
@camera_bp.route("/recog/name/<id>", methods=["PUT"])
def update_recog_name(id):
    data = request.json
    new_name = data.get("name")
    if not new_name:
        return jsonify({"error": "Name is required in the request body"}), 400

    # Update the label in the database
    result = stream_instance.recognition_logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
    if result.matched_count == 0:
        return jsonify({"error": f"No logs found for ID: {id}"}), 404

    # Determine the correct source and destination folder paths
    base_dir = os.path.join('recog')
    unknown_faces_path = os.path.join(base_dir, 'unknown_faces', id)
    known_faces_old_path = os.path.join(base_dir, 'known_faces', id)
    known_faces_new_path = os.path.join(base_dir, 'known_faces', new_name)
    face_images_path = './face-images'

    # Determine the source path (either unknown_faces or known_faces)
    src_path = unknown_faces_path if os.path.exists(unknown_faces_path) else known_faces_old_path

    try:
        # Ensure known_faces/<new_name> directory exists
        os.makedirs(known_faces_new_path, exist_ok=True)
    except PermissionError:
        return jsonify({"error": f"Permission denied when creating directory: {known_faces_new_path}"}), 403

    moved_files = []
    try:
        # Rename and move files from old folder to the appropriate directories
        for file_name in os.listdir(src_path):
            if file_name.endswith((".jpg", ".png", ".jpeg")):
                new_known_faces_file_name = f"{new_name}-{id}.jpeg"
                known_faces_dst_path = os.path.join(known_faces_new_path, new_known_faces_file_name)
                new_face_images_file_name = f"{new_name}.jpeg"
                face_images_dst_path = os.path.join(face_images_path, new_face_images_file_name)

                # Check if a file with the same name already exists in face-images
                existing_files = [
                    f for f in os.listdir(face_images_path)
                    if os.path.splitext(f)[0] == new_name and f.endswith((".jpg", ".png", ".jpeg"))
                ]
                if existing_files:
                    logging.warning(f"File with the name '{new_name}' already exists in face-images. Skipping file.")
                    continue

                src_file_path = os.path.join(src_path, file_name)
                try:
                    # Move the file to the known_faces directory with the new name
                    shutil.move(src_file_path, known_faces_dst_path)
                    moved_files.append((new_known_faces_file_name, known_faces_dst_path))
                    # Also move the file to the face-images directory
                    shutil.copy(known_faces_dst_path, face_images_dst_path)

                    # Update the image path in the database for each moved file
                    stream_instance.recognition_logs_collection.update_many(
                        {"label": new_name, "image_path": src_file_path},
                        {"$set": {"image_path": known_faces_dst_path}}
                    )
                except PermissionError:
                    return jsonify({"error": f"Permission denied when moving or copying file: {src_file_path}"}), 403
                except shutil.Error as e:
                    return jsonify({"error": f"Error moving or copying file: {str(e)}"}), 500

        # Call update_database with old_name (id) and new_name
        try:
            stream_instance.update_database(id, new_name)
        except Exception as e:
            return jsonify({"error": f"Error updating database: {str(e)}"}), 500

        # Remove the old folder if it's empty
        if not os.listdir(src_path):
            try:
                os.rmdir(src_path)
            except PermissionError:
                logging.warning(f"Permission denied when trying to remove directory: {src_path}")
            except OSError as e:
                logging.warning(f"Error removing directory {src_path}: {str(e)}")

    except FileNotFoundError:
        return jsonify({"error": f"Folder not found: {src_path}"}), 404
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

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


app.register_blueprint(camera_bp)

# @camera_bp.route("/camera-url", methods=["POST"])
# # @jwt_required()
# def add_camera_url():
#     data = request.json
#     label = data.get("label")
#     url = data.get("url")
#     if not label or not url:
#         return jsonify({"error": "Label and URL are required"}), 400
#     camera = {"label": label, "url": url}
#     result = camera_collection.insert_one(camera)
#     # Convert ObjectId to string
#     camera["_id"] = str(result.inserted_id)
#     # Emit the new camera data
#     notify_new_camera_url(camera=camera)
#     return jsonify({"message": "Camera URL added successfully"}), 200


# @camera_bp.route("/camera-urls", methods=["GET"])
# # @jwt_required()
# def get_camera_urls():
#     cameras = list(camera_collection.find({}))
#     print(cameras)
#     return bson.json_util.dumps(cameras), 200


# @camera_bp.route("/camera-url/<label>", methods=["DELETE"])
# # @jwt_required()
# def delete_camera_url(label):
#     result = camera_collection.delete_one({"label": label})

#     if result.deleted_count == 0:
#         return jsonify({"error": "Camera label not found"}), 404

#     return jsonify({"message": "Camera URL deleted successfully"}), 200


# @camera_bp.route("/camera-url/<label>", methods=["PUT"])
# # @jwt_required()
# def update_camera_url(label):
#     data = request.json
#     new_label = data.get("label")
#     new_url = data.get("url")
#     if not new_label or not new_url:
#         return jsonify({"error": "Label and URL are required"}), 400

#     result = camera_collection.update_one(
#         {"label": label}, {"$set": {"label": new_label, "url": new_url}}
#     )

#     if result.matched_count == 0:
#         return jsonify({"error": "Camera label not found"}), 404

#     return jsonify({"message": "Camera URL updated successfully"}), 200


# # ****************************************************************************
# @camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# # @jwt_required()
# def stream(stream_id):
#     is_recording = request.args.get("is_recording") == "true"
#     camera = request.args.get("camera")
#     quality = request.args.get("quality")
#     # print("Camera: ", camera)
#     # print("Quality: ", quality)
#     return Response(
#         stream_instance.recog_face_ip_cam(
#             stream_id,
#             camera=camera,
#             quality=quality,
#             is_recording=is_recording,
#         ),
#         mimetype="multipart/x-mixed-replace; boundary=frame",
#     )

# # ****************************************************************************
# # Local CAM Stream
# @socketio.on('video_frame')
# def handle_video_frame(data):
#     frame_data = data['frame']
#     is_recording = data['isRecording']

#     # Decode the image
#     image_data = frame_data.split(',')[1]
#     nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
#     img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#     # Process the image
#     processed_image = stream_instance.recog_face_local_cam(img, is_recording)

#     # Emit the processed frame back to the client
#     socketio.emit('processed_frame', processed_image)

# # ****************************************************************************

# @camera_bp.route("/recog", methods=["GET"])
# def get_all_logs():
#     logs = list(
#         logs_collection.find({}, {}).sort("timestamp", DESCENDING)
#     )  # Exclude _id from the results
#     return bson.json_util.dumps(logs)
#     # return "Hello"


# @camera_bp.route("/recog/<id>", methods=["GET"])
# def get_log(id):
#     log = logs_collection.find_one({"_id": ObjectId(id)})
#     if log:
#         return jsonify(log)
#     else:
#         return jsonify({"error": "Log not found"}), 404


# @camera_bp.route("/recog/<id>", methods=["PUT"])
# def update_log(id):
#     data = request.json
#     logs_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
#     return jsonify({"message": "Log updated successfully"}), 200


# @camera_bp.route("/recog/<id>", methods=["DELETE"])
# def delete_log(id):
#     logs_collection.delete_one({"_id": ObjectId(id)})
#     return jsonify({"message": "Log deleted successfully"}), 200


# # @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# # def update_recog_name(id):
# #     data = request.json
# #     new_name = data.get("name")
# #     if not new_name:
# #         return jsonify({"error": "Name is required"}), 400

# #     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
# #     if result.matched_count == 0:
# #         return jsonify({"error": "Log not found"}), 404

# #     return jsonify({"message": "Name updated successfully"}), 200


# @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# def update_recog_name(id):
#     data = request.json
#     new_name = data.get("name")
#     if not new_name:
#         return jsonify({"error": "Name is required"}), 400

#     # Update the label in the database
#     result = stream_instance.recognition_logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
#     if result.matched_count == 0:
#         return jsonify({"error": "Log not found"}), 404
  
#     # Determine the correct source folder path
#     base_dir = os.path.join('recog')
#     unknown_faces_path = os.path.join(base_dir, 'unknown_faces', id)
#     known_faces_path = os.path.join(base_dir, 'known_faces', new_name)
#     face_images_path = './face-images'

#     try:
#         # Ensure known_faces/<name> directory exists
#         if not os.path.exists(known_faces_path):
#             os.makedirs(known_faces_path)

#         moved_files = []

#         # Rename and move files from old folder to the appropriate directories
#         for file_name in os.listdir(unknown_faces_path):
#             if file_name.endswith((".jpg", ".png", ".jpeg")):
#                 # Construct the new file name as <new_name>-<id>.jpeg for known_faces
#                 new_known_faces_file_name = f"{new_name}-{id}.jpeg"
#                 known_faces_dst_path = os.path.join(known_faces_path, new_known_faces_file_name)

#                 # Construct the new file name as <new_name>.jpeg for face-images
#                 new_face_images_file_name = f"{new_name}.jpeg"
#                 face_images_dst_path = os.path.join(face_images_path, new_face_images_file_name)
                
#                 # Check if a file with the same name already exists in face-images
#                 existing_files = [
#                     f for f in os.listdir(face_images_path)
#                     if os.path.splitext(f)[0] == new_name and f.endswith((".jpg", ".png", ".jpeg"))
#                 ]
                
#                 if existing_files:
#                     print(f"File with the name '{new_name}' already exists in face-images. Skipping file.")
#                     continue  # Skip this file as a similar file exists
                
#                 src_file_path = os.path.join(unknown_faces_path, file_name)
                
#                 # Move the file to the known_faces directory with the new name
#                 shutil.move(src_file_path, known_faces_dst_path)
#                 moved_files.append((new_known_faces_file_name, known_faces_dst_path))

#                 # Also move the file to the face-images directory
#                 shutil.copy(known_faces_dst_path, face_images_dst_path)
        
#         # Call update_database with old_name (id) and new_name
#         stream_instance.update_database(id, new_name)

#         # Remove the old folder if it's empty
#         if not os.listdir(unknown_faces_path):
#             os.rmdir(unknown_faces_path)

#         # Update the image paths in the database
#         for new_file_name, new_path in moved_files:
#             stream_instance.recognition_logs_collection.update_many(
#                 {"label": new_name},
#                 {
#                     "$set": {
#                         "image_path": new_path
#                     }
#                 }
#             )
#     except FileNotFoundError:
#         return jsonify({"error": "Folder not found"}), 404
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     return jsonify({"message": "Name, image paths updated, and images moved successfully"}), 200

# # -----------------------------------Çalışan Kod




# @camera_bp.route("/images/<path:image_path>", methods=["GET"])
# def get_image(image_path):
#     full_path = os.path.join(os.getcwd(), image_path)
#     try:
#         return send_file(full_path, mimetype="image/jpeg")
#     except FileNotFoundError:
#         return jsonify({"error": "Image not found"}), 404


# @camera_bp.route("/faces/<image_name>", methods=["GET"])
# def get_face_image(image_name):
#     # Define the directory to search in and the possible extensions
#     search_dir = os.path.join(os.getcwd(), "face-images")
#     print("------" + search_dir)
#     extensions = ['jpg', 'jpeg', 'png']
    
#     # Search for files matching the image name with any of the extensions
#     for ext in extensions:
#         file_pattern = os.path.join(search_dir, f"{image_name}.{ext}")
#         matching_files = glob.glob(file_pattern)
#         if matching_files:
#             # If a match is found, send the first matching file
#             return send_file(matching_files[0], mimetype="image/jpeg")
    
#     # If no file matches, return an error message
#     return jsonify({"error": "Image not found"}), 404


# # @camera_bp.route("/camera/<int:cam_id>", methods=["GET"])
# # # @jwt_required()
# # def local_camera(cam_id):

# #     return Response(
# #         camera_processor.local_camera_stream(cam_id, request.args.get("quality")),
# #         mimetype="multipart/x-mixed-replace; boundary=frame",
# #     )


# app.register_blueprint(camera_bp)

# @camera_bp.route("/camera-url", methods=["POST"])
# # @jwt_required()
# def add_camera_url():
#     data = request.json
#     label = data.get("label")
#     url = data.get("url")
#     if not label or not url:
#         return jsonify({"error": "Label and URL are required"}), 400
#     camera = {"label": label, "url": url}
#     result = camera_collection.insert_one(camera)
#     # Convert ObjectId to string
#     camera["_id"] = str(result.inserted_id)
#     # Emit the new camera data
#     notify_new_camera_url(camera=camera)
#     return jsonify({"message": "Camera URL added successfully"}), 200


# @camera_bp.route("/camera-urls", methods=["GET"])
# # @jwt_required()
# def get_camera_urls():
#     cameras = list(camera_collection.find({}))
#     print(cameras)
#     return bson.json_util.dumps(cameras), 200


# @camera_bp.route("/camera-url/<label>", methods=["DELETE"])
# # @jwt_required()
# def delete_camera_url(label):
#     result = camera_collection.delete_one({"label": label})

#     if result.deleted_count == 0:
#         return jsonify({"error": "Camera label not found"}), 404

#     return jsonify({"message": "Camera URL deleted successfully"}), 200


# @camera_bp.route("/camera-url/<label>", methods=["PUT"])
# # @jwt_required()
# def update_camera_url(label):
#     data = request.json
#     new_label = data.get("label")
#     new_url = data.get("url")
#     if not new_label or not new_url:
#         return jsonify({"error": "Label and URL are required"}), 400

#     result = camera_collection.update_one(
#         {"label": label}, {"$set": {"label": new_label, "url": new_url}}
#     )

#     if result.matched_count == 0:
#         return jsonify({"error": "Camera label not found"}), 404

#     return jsonify({"message": "Camera URL updated successfully"}), 200


# # ****************************************************************************
# @camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# # @jwt_required()
# def stream(stream_id):
#     is_recording = request.args.get("is_recording") == "true"
#     camera = request.args.get("camera")
#     quality = request.args.get("quality")
#     # print("Camera: ", camera)
#     # print("Quality: ", quality)
#     return Response(
#         stream_instance.recog_face_ip_cam(
#             stream_id,
#             camera=camera,
#             quality=quality,
#             is_recording=is_recording,
#         ),
#         mimetype="multipart/x-mixed-replace; boundary=frame",
#     )

# # ****************************************************************************
# # Local CAM Stream
# @socketio.on('video_frame')
# def handle_video_frame(data):
#     frame_data = data['frame']
#     is_recording = data['isRecording']

#     # Decode the image
#     image_data = frame_data.split(',')[1]
#     nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
#     img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#     # Process the image
#     processed_image = stream_instance.recog_face_local_cam(img, is_recording)

#     # Emit the processed frame back to the client
#     socketio.emit('processed_frame', processed_image)
# # ****************************************************************************

# @camera_bp.route("/recog", methods=["GET"])
# def get_all_logs():
#     logs = list(
#         logs_collection.find({}, {}).sort("timestamp", DESCENDING)
#     )  # Exclude _id from the results
#     return bson.json_util.dumps(logs)
#     # return "Hello"


# @camera_bp.route("/recog/<id>", methods=["GET"])
# def get_log(id):
#     log = logs_collection.find_one({"_id": ObjectId(id)})
#     if log:
#         return jsonify(log)
#     else:
#         return jsonify({"error": "Log not found"}), 404


# @camera_bp.route("/recog/<id>", methods=["PUT"])
# def update_log(id):
#     data = request.json
#     logs_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
#     return jsonify({"message": "Log updated successfully"}), 200


# @camera_bp.route("/recog/<id>", methods=["DELETE"])
# def delete_log(id):
#     logs_collection.delete_one({"_id": ObjectId(id)})
#     return jsonify({"message": "Log deleted successfully"}), 200


# # @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# # def update_recog_name(id):
# #     data = request.json
# #     new_name = data.get("name")
# #     if not new_name:
# #         return jsonify({"error": "Name is required"}), 400

# #     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
# #     if result.matched_count == 0:
# #         return jsonify({"error": "Log not found"}), 404

# #     return jsonify({"message": "Name updated successfully"}), 200

# @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# def update_recog_name(id):
#     data = request.json
#     new_name = data.get("name")
#     if not new_name:
#         return jsonify({"error": "Name is required"}), 400

#     # Update the label in the database
#     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
#     if result.matched_count == 0:
#         return jsonify({"error": "Log not found"}), 404
  
#     # Determine the correct source folder path
#     base_dir = os.path.join('recog')
#     unknown_faces_path = os.path.join(base_dir, 'unknown_faces', id)
#     known_faces_path = os.path.join(base_dir, 'known_faces', id)
#     if os.path.exists(unknown_faces_path):
#         old_folder_path = unknown_faces_path
#     elif os.path.exists(known_faces_path):
#         old_folder_path = known_faces_path
#     else:
#         return jsonify({"error": "Image folder not found"}), 404

#     new_folder_path = os.path.join(base_dir, 'known_faces', new_name)

#     try:
#         # Check if the target directory exists
#         if not os.path.exists(new_folder_path):
#             os.makedirs(new_folder_path)
        
#         # Rename and move files from old to new folder
#         for file_name in os.listdir(old_folder_path):
#             if file_name.startswith(id):
#                 # Construct the new file name by replacing id with new_name
#                 new_file_name = file_name.replace(id, new_name, 1)
#                 src_file_path = os.path.join(old_folder_path, file_name)
#                 dst_file_path = os.path.join(new_folder_path, new_file_name)
                
#                 # Move the file with the new name
#                 shutil.move(src_file_path, dst_file_path)
#             else:
#                 # If the file does not start with id, move it without renaming
#                 src_file_path = os.path.join(old_folder_path, file_name)
#                 dst_file_path = os.path.join(new_folder_path, file_name)
#                 shutil.move(src_file_path, dst_file_path)

#         # Remove the old folder if it's empty
#         if not os.listdir(old_folder_path):
#             os.rmdir(old_folder_path)

#         # Update the image paths in the database
#         logs_collection.update_many(
#             {"label": new_name},
#             [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": id, "replacement": new_name}}}},
#              {"$set": {"image_path": {"$replaceOne": {"input": "$image_path", "find": "unknown_faces", "replacement": "known_faces"}}}}
             
#              ]
#         )
#     except FileNotFoundError:
#         return jsonify({"error": "Folder not found"}), 404
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200@camera_bp.route("/recog/name/<id>", methods=["PUT"])

# # def update_recog_name(id):
# #     data = request.json
# #     new_name = data.get("name")
# #     if not new_name:
# #         return jsonify({"error": "Name is required"}), 400

# #     # Update the label in the database
# #     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
# #     if result.matched_count == 0:
# #         return jsonify({"error": "Log not found"}), 404

# #     # Determine the correct source folder path
# #     base_dir = os.path.join('recog')
# #     unknown_faces_path = os.path.join(base_dir, 'unknown_faces', id)
# #     known_faces_path = os.path.join(base_dir, 'known_faces', id)
# #     if os.path.exists(unknown_faces_path):
# #         old_folder_path = unknown_faces_path
# #     elif os.path.exists(known_faces_path):
# #         old_folder_path = known_faces_path
# #     else:
# #         return jsonify({"error": "Image folder not found"}), 404

# #     new_folder_path = os.path.join(base_dir, 'known_faces', new_name)

# #     try:
# #         # Check if the target directory exists
# #         if not os.path.exists(new_folder_path):
# #             os.makedirs(new_folder_path)
        
# #         # Move files from old to new folder
# #         for file_name in os.listdir(old_folder_path):
# #             src_file_path = os.path.join(old_folder_path, file_name)
# #             dst_file_path = os.path.join(new_folder_path, file_name)
# #             shutil.move(src_file_path, dst_file_path)

# #         # Remove the old folder if it's empty
# #         if not os.listdir(old_folder_path):
# #             os.rmdir(old_folder_path)

# #         # Update the image paths in the database
# #         logs_collection.update_many(
# #             {"label": new_name},
# #             [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": id, "replacement": new_name}}}}]
# #         )
# #     except FileNotFoundError:
# #         return jsonify({"error": "Folder not found"}), 404
# #     except Exception as e:
# #         return jsonify({"error": str(e)}), 500

# #     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200

# # @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# # def update_recog_name(id):
# #     data = request.json
# #     new_name = data.get("name")
# #     if not new_name:
# #         return jsonify({"error": "Name is required"}), 400

# #     # Update the label in the database
# #     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
# #     if result.matched_count == 0:
# #         return jsonify({"error": "Log not found"}), 404

# #     # Correctly handle folder paths
# #     base_dir_known = os.path.join('recog', 'known_faces')
# #     base_dir_unknown = os.path.join('recog', 'unknown_faces')
# #     old_folder_path = os.path.join(base_dir_unknown, id)
# #     new_folder_path = os.path.join(base_dir_known, new_name)

# #     try:
# #         # Check if the target directory exists
# #         if not os.path.exists(new_folder_path):
# #             os.makedirs(new_folder_path)
        
# #         # Copy files from old to new folder
# #         for file_name in os.listdir(old_folder_path):
# #             src_file_path = os.path.join(old_folder_path, file_name)
# #             dst_file_path = os.path.join(new_folder_path, file_name)
# #             shutil.copy(src_file_path, dst_file_path)

# #         # Update the image paths in the database using an aggregation pipeline
# #         logs_collection.update_many(
# #             {"label": new_name},
# #             [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": f"unknown_faces/{id}/", "replacement": f"known_faces/{new_name}/"}}}}]
# #         )
# #     except FileNotFoundError:
# #         return jsonify({"error": "Folder not found"}), 404
# #     except Exception as e:
# #         return jsonify({"error": str(e)}), 500

# #     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200

# # @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# # def update_recog_name(id):
# #     data = request.json
# #     new_name = data.get("name")
# #     if not new_name:
# #         return jsonify({"error": "Name is required"}), 400

# #     # Update the label in the database
# #     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
# #     if result.matched_count == 0:
# #         return jsonify({"error": "Log not found"}), 404

# #     # Correctly handle folder paths
# #     base_dir_known = os.path.join('recog', 'known_faces')
# #     base_dir_unknown = os.path.join('recog', 'unknown_faces')
# #     old_folder_path = os.path.join(base_dir_unknown, id)  # Changed to unknown_faces
# #     new_folder_path = os.path.join(base_dir_known, new_name)  # Target is known_faces
    
# #     try:
# #         # Move the directory if it exists, handle existing target
# #         if os.path.exists(old_folder_path):
# #             if os.path.exists(new_folder_path):
# #                 shutil.rmtree(new_folder_path)
# #             shutil.move(old_folder_path, new_folder_path)

# #         # Update the image paths in the database using an aggregation pipeline
# #         logs_collection.update_many(
# #             {"label": new_name},
# #             [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": f"unknown_faces/{id}/", "replacement": f"known_faces/{new_name}/"}}}}]
# #         )
# #     except FileNotFoundError:
# #         return jsonify({"error": "Folder not found"}), 404
# #     except Exception as e:
# #         return jsonify({"error": str(e)}), 500

# #     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200


# # @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# # def update_recog_name(id):
# #     data = request.json
# #     new_name = data.get("name")
# #     if not new_name:
# #         return jsonify({"error": "Name is required"}), 400

# #     # Update the name in the database
# #     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
# #     if result.matched_count == 0:
# #         return jsonify({"error": "Log not found"}), 404

# #     # Copy and rename the folder
# #     base_dir = os.path.join('recog', 'known_faces')
# #     old_folder_path = os.path.join(base_dir, id)
# #     new_folder_path = os.path.join(base_dir, new_name)
    
# #     try:
# #         # Copy the directory if it exists
# #         if os.path.exists(old_folder_path):
# #             shutil.copytree(old_folder_path, new_folder_path)
        
# #         # Rename the folder
# #         os.rename(old_folder_path, new_folder_path)

# #         # Update the image paths in the database
# #         logs_collection.update_many(
# #             {"label": new_name},
# #             {"$set": {"image_path": {"$replaceOne": {"input": "$image_path", "find": id, "replacement": new_name}}}}
# #         )
# #     except FileNotFoundError:
# #         return jsonify({"error": "Folder not found"}), 404
# #     except Exception as e:
# #         return jsonify({"error": str(e)}), 500

# #     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200



# @camera_bp.route("/images/<path:image_path>", methods=["GET"])
# def get_image(image_path):
#     full_path = os.path.join(os.getcwd(), image_path)
#     try:
#         return send_file(full_path, mimetype="image/jpeg")
#     except FileNotFoundError:
#         return jsonify({"error": "Image not found"}), 404


# @camera_bp.route("/faces/<image_name>", methods=["GET"])
# def get_face_image(image_name):
#     # Define the directory to search in and the possible extensions
#     search_dir = os.path.join(os.getcwd(), "face-images")
#     print("------" + search_dir)
#     extensions = ['jpg', 'jpeg', 'png']
    
#     # Search for files matching the image name with any of the extensions
#     for ext in extensions:
#         file_pattern = os.path.join(search_dir, f"{image_name}.{ext}")
#         matching_files = glob.glob(file_pattern)
#         if matching_files:
#             # If a match is found, send the first matching file
#             return send_file(matching_files[0], mimetype="image/jpeg")
    
#     # If no file matches, return an error message
#     return jsonify({"error": "Image not found"}), 404


# # @camera_bp.route("/camera/<int:cam_id>", methods=["GET"])
# # # @jwt_required()
# # def local_camera(cam_id):

# #     return Response(
# #         camera_processor.local_camera_stream(cam_id, request.args.get("quality")),
# #         mimetype="multipart/x-mixed-replace; boundary=frame",
# #     )


# app.register_blueprint(camera_bp)


# # #########################CAMERA ROUTES###############################################

# # @camera_bp.route("/camera-url", methods=["POST"])
# # # @jwt_required()
# # def add_camera_url():
# #     data = request.json
# #     label = data.get("label")
# #     url = data.get("url")
# #     if not label or not url:
# #         return jsonify({"error": "Label and URL are required"}), 400
# #     camera = {"label": label, "url": url}
# #     result = camera_collection.insert_one(camera)
# #     # Convert ObjectId to string
# #     camera["_id"] = str(result.inserted_id)
# #     # Emit the new camera data
# #     notify_new_camera_url(camera=camera)
# #     return jsonify({"message": "Camera URL added successfully"}), 200


# # @camera_bp.route("/camera-urls", methods=["GET"])
# # # @jwt_required()
# # def get_camera_urls():
# #     cameras = list(camera_collection.find({}))
# #     print(cameras)
# #     return bson.json_util.dumps(cameras), 200


# # @camera_bp.route("/camera-url/<label>", methods=["DELETE"])
# # # @jwt_required()
# # def delete_camera_url(label):
# #     result = camera_collection.delete_one({"label": label})

# #     if result.deleted_count == 0:
# #         return jsonify({"error": "Camera label not found"}), 404

# #     return jsonify({"message": "Camera URL deleted successfully"}), 200


# # @camera_bp.route("/camera-url/<label>", methods=["PUT"])
# # # @jwt_required()
# # def update_camera_url(label):
# #     data = request.json
# #     new_label = data.get("label")
# #     new_url = data.get("url")
# #     if not new_label or not new_url:
# #         return jsonify({"error": "Label and URL are required"}), 400

# #     result = camera_collection.update_one(
# #         {"label": label}, {"$set": {"label": new_label, "url": new_url}}
# #     )

# #     if result.matched_count == 0:
# #         return jsonify({"error": "Camera label not found"}), 404

# #     return jsonify({"message": "Camera URL updated successfully"}), 200


# # # ****************************************************************************
# # @camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# # # @jwt_required()
# # def stream(stream_id):
# #     is_recording = request.args.get("is_recording") == "true"
# #     camera = request.args.get("camera")
# #     quality = request.args.get("quality")
# #     # print("Camera: ", camera)
# #     # print("Quality: ", quality)
# #     return Response(
# #         camera_processor.generate(
# #             stream_id,
# #             camera=camera,
# #             quality=quality,
# #             is_recording=is_recording,
# #         ),
# #         mimetype="multipart/x-mixed-replace; boundary=frame",
# #     )


# # @camera_bp.route("/recog", methods=["GET"])
# # def get_all_logs():
# #     logs = list(logs_collection.find({}, {}))  # Exclude _id from the results
# #     return bson.json_util.dumps(logs)
# #     # return "Hello"


# # @camera_bp.route("/recog/<id>", methods=["GET"])
# # def get_log(id):
# #     log = logs_collection.find_one({"_id": ObjectId(id)})
# #     if log:
# #         return jsonify(log)
# #     else:
# #         return jsonify({"error": "Log not found"}), 404


# # @camera_bp.route("/recog/<id>", methods=["PUT"])
# # def update_log(id):
# #     data = request.json
# #     logs_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
# #     return jsonify({"message": "Log updated successfully"}), 200


# # @camera_bp.route("/recog/<id>", methods=["DELETE"])
# # def delete_log(id):
# #     logs_collection.delete_one({"_id": ObjectId(id)})
# #     return jsonify({"message": "Log deleted successfully"}), 200


# # @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# # def update_recog_name(id):
# #     data = request.json
# #     new_name = data.get("name")
# #     if not new_name:
# #         return jsonify({"error": "Name is required"}), 400

# #     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
# #     if result.matched_count == 0:
# #         return jsonify({"error": "Log not found"}), 404

# #     return jsonify({"message": "Name updated successfully"}), 200


# # @camera_bp.route("/images/<path:image_path>", methods=["GET"])
# # def get_image(image_path):
# #     full_path = os.path.join(os.getcwd(), image_path)
# #     try:
# #         return send_file(full_path, mimetype="image/jpeg")
# #     except FileNotFoundError:
# #         return jsonify({"error": "Image not found"}), 404


# # @camera_bp.route("/faces/<path:image_path>", methods=["GET"])
# # def get_face_image(image_path):
# #     full_path = os.path.join(os.getcwd(), image_path)
# #     try:
# #         return send_file(full_path, mimetype="image/jpeg")
# #     except FileNotFoundError:
# #         return jsonify({"error": "Image not found"}), 404


# # # @camera_bp.route("/camera/<int:cam_id>", methods=["GET"])
# # # # @jwt_required()
# # # def local_camera(cam_id):

# # #     return Response(
# # #         camera_processor.local_camera_stream(cam_id, request.args.get("quality")),
# # #         mimetype="multipart/x-mixed-replace; boundary=frame",
# # #     )


# # app.register_blueprint(camera_bp)


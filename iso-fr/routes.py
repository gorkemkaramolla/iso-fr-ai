

import base64
import glob
import shutil
import subprocess
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
import bson
import bson.json_util
from flask import Flask, Blueprint, request, jsonify, Response, send_file, abort
import flask.json.provider as provider
from pymongo import DESCENDING, MongoClient
# from services.camera_processor.Stream import Stream
from services.camera_processor.StreamR import Stream
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
from config import XMLConfig
import requests
import os

# Unset proxy environment variables
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('ALL_PROXY', None)
# Load environment variables from .env file
load_dotenv()

# Initialize XML Config
xml_config = XMLConfig(service_name='face_recognition_service')
mongo_config = XMLConfig(service_name='mongo')

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False

# Configure CORS using the values from xml_config
CORS(app, supports_credentials=xml_config.SUPPORTS_CREDENTIALS, origins=xml_config.CORS_ORIGINS)

# Configure JWT using the values from xml_config
app.config["JWT_SECRET_KEY"] = xml_config.JWT_SECRET_KEY
app.config["JWT_TOKEN_LOCATION"] = xml_config.JWT_TOKEN_LOCATION
app.config["JWT_ACCESS_COOKIE_PATH"] = xml_config.JWT_ACCESS_COOKIE_PATH
app.config["JWT_REFRESH_COOKIE_PATH"] = xml_config.JWT_REFRESH_COOKIE_PATH
app.config["JWT_COOKIE_SECURE"] = xml_config.JWT_COOKIE_SECURE
app.config["JWT_COOKIE_CSRF_PROTECT"] = xml_config.JWT_COOKIE_CSRF_PROTECT
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = xml_config.get_jwt_expire_timedelta()
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = xml_config.get_jwt_refresh_expire_timedelta()

# Setup MongoDB using configuration
client = MongoClient(mongo_config.MONGO_DB_URI)
print(f"MongoDB URI: {mongo_config.MONGO_DB_URI}")
db = client[mongo_config.MONGO_DB_NAME]
logs_collection = db[xml_config.LOGGING_COLLECTION if xml_config.LOGGING_COLLECTION else 'logs']
camera_collection = db[xml_config.CAMERA_COLLECTION if xml_config.CAMERA_COLLECTION else 'cameras']

# Create instances
stream_instance = Stream(device= xml_config.DEVICE if xml_config.DEVICE else 'cpu', anti_spoof=xml_config.ANTI_SPOOF)
# logger = configure_logging()

# Setup Blueprint
camera_bp = Blueprint("camera_bp", __name__)

######################### CAMERA ROUTES ###############################################

# Video Records
VIDEO_FOLDER = xml_config.VIDEO_FOLDER if xml_config.VIDEO_FOLDER else 'records'
@camera_bp.route('/videos/<filename>')
def get_video(filename):
    file_path = os.path.join(VIDEO_FOLDER, filename)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    if "converted" not in filename:
        repaired_file_path = repair_last_record(file_path)
        if repaired_file_path is None:
            return jsonify({'error': 'Failed to process video'}), 500
        return send_file(repaired_file_path, as_attachment=True)

    return send_file(file_path, as_attachment=False)


@camera_bp.route('/videos')
def list_videos():
    files = os.listdir(VIDEO_FOLDER)
    videos = []

    for file in files:
        # if file.endswith('.mp4'):
        #     file_path = os.path.join(VIDEO_FOLDER, file)
        #     if "converted" in file:
        videos.append({'filename': file, 'title': file})
            # else:
            #     repaired_file_path = repair_last_record(file_path)
            #     repaired_filename = os.path.basename(repaired_file_path)
            #     videos.append({'filename': repaired_filename, 'title': repaired_filename})

    return jsonify(videos)

def repair_last_record(filename: str) -> str:
    print(f"----------------------------Repairing last record: {filename}")
    output_file = filename.replace(".mp4", "_converted.mp4")
    command = ["ffmpeg", "-i", filename, "-vcodec", "h264", "-acodec", "aac", output_file]

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print(f"FFmpeg output: {result.stdout}")
        print(f"FFmpeg error (if any): {result.stderr}")

        if os.path.exists(output_file):
            os.remove(filename)
            return output_file
        else:
            raise FileNotFoundError(f"Output file {output_file} was not created.")
    except subprocess.CalledProcessError as e:
        print(f"Error during FFmpeg conversion: {e.stderr}")
        return None
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return None

@camera_bp.route('/videos/<filename>', methods=['DELETE'])
def delete_video(filename):
    file_path = os.path.join(VIDEO_FOLDER, filename)
    
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({'message': f'{filename} has been deleted.'}), 200
        except Exception as e:
            abort(500, description=f"An error occurred while deleting the file: {str(e)}")
    else:
        abort(404, description="Resource not found")

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
    camera["_id"] = str(result.inserted_id)
    notify_new_camera_url(camera=camera)
    return jsonify({"message": "Camera URL added successfully"}), 200

@camera_bp.route("/camera-urls", methods=["GET"])
# @jwt_required()
def get_camera_urls():
    cameras = list(camera_collection.find({}))
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

@camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# @jwt_required()
def stream(stream_id):
    is_recording = request.args.get("is_recording") == "true"
    camera = request.args.get("camera")
    camera_name = request.args.get("cameraName")
    quality = request.args.get("streamProfile")

    print(f"------------- Route-Camera: {camera}")
    print(f"------------- Route-Quality: {quality}")

    parsed_url = urlparse(camera)
    query_params = parse_qs(parsed_url.query)

    quality_mapping = xml_config.STREAM_QUALITY_MAPPING

    if quality in quality_mapping:
        query_params["resolution"] = [quality_mapping[quality]["resolution"]]
        query_params["compression"] = [quality_mapping[quality]["compression"]]

    new_query_string = urlencode(query_params, doseq=True)
    new_camera_url = urlunparse(parsed_url._replace(query=new_query_string))

    print(f"------------- Updated Camera URL: {new_camera_url}")

    return Response(
        stream_instance.recog_face_ip_cam(
            stream_id,
            camera=new_camera_url,
            camera_name=camera_name,
            is_recording=is_recording,
        ),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@camera_bp.route("/stream/start/<int:stream_id>", methods=["POST"])
def start_stream(stream_id):
    stream_instance.start_stream(stream_id)
    return jsonify({"message": "Stream started successfully"}), 200

@camera_bp.route("/stream/stop/<int:stream_id>", methods=["POST"])
def stop_stream(stream_id):
    stream_instance.stop_stream(stream_id)
    return jsonify({"message": "Stream stopped successfully"}), 200

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

@socketio.on('video_frames')
def handle_video_frames(data):
    room = data['room']
    stream_id = data["streamId"]
    frames_data = data['frames']
    camera_name = data['cameraName']
    is_recording = data['isRecording']

    processed_frames = []
    # stream_instance.fetch_personnel_records()
    # url = "http://utils_service:5004/personel"
    # try:
    #     # Disable proxy for this request
    #     response = requests.get(url)
    #     response.raise_for_status()  # Raise an HTTPError for bad responses
    #     personnel_records = response.json()
    #     print("Personnel Records:")
    #     for record in personnel_records:
    #         print("---------Personnel Record---------")
    #         print(record)
    # except requests.exceptions.RequestException as e:
    #     print(f"An error occurred: {e}")

    for frame_data in frames_data:
        image_data = frame_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        processed_image = stream_instance.recog_face_local_cam(stream_id, frame, camera_name, is_recording)
        processed_frames.append(processed_image)

    emit('processed_frames', {'frames': processed_frames}, room=room)

@app.route('/local_stream/stop_recording/<int:stream_id>', methods=['POST'])
def stop_recording(stream_id):
    success = stream_instance.stop_recording(stream_id)
    if success:
        return jsonify({'message': 'Recording stopped successfully'}), 200
    else:
        return jsonify({'error': 'Failed to stop recording'}), 500



@camera_bp.route("/update_database_with_id", methods=["POST"])
def update_database_with_id():
    data = request.json
    personnel_id = data.get('personnel_id')
    
    if not personnel_id:
        return jsonify({"status": "error", "message": "personnel_id is required"}), 400
    
    try:
        stream_instance.update_database_with_personnel_id(personnel_id)
        return jsonify({"status": "success", "message": f"Embedding saved for {personnel_id}"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@camera_bp.route("/recog", methods=["GET"])
def get_all_logs_by_date():
    date_str = request.args.get('date')
    query = {}
    if date_str:
        try:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            tz = pytz.timezone('Etc/GMT-3')
            date = date.astimezone(tz)
            start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            start_of_day_ms = int(start_of_day.timestamp() * 1000)
            end_of_day_ms = int(end_of_day.timestamp() * 1000)
            query['timestamp'] = {'$gte': start_of_day_ms, '$lt': end_of_day_ms}
        except ValueError:
            return "Invalid date format. Use ISO 8601 format.", 400

    logs = list(
        logs_collection.find(query, {}).sort("timestamp", DESCENDING)
    )
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

# @camera_bp.route("/recog/<id>", methods=["DELETE"])
# def delete_log(id):
#     logs_collection.delete_one({"_id": ObjectId(id)})
#     return jsonify({"message": "Log deleted successfully"}), 200
@camera_bp.route("/recog/<id>", methods=["DELETE"])
def delete_log(id):
    # Find the document by ID
    log = logs_collection.find_one({"_id": ObjectId(id)})
    
    if log:
        # Extract the image path
        image_path = log.get("image_path")
        
        # Delete the image file if it exists
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
        
        # Delete the document from the collection
        logs_collection.delete_one({"_id": ObjectId(id)})
        
        return jsonify({"message": "Log and associated image deleted successfully"}), 200
    else:
        return jsonify({"error": "Log not found"}), 404
    
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
    base_dir = xml_config.BASE_RECOG_DIR
    unknown_faces_path = os.path.join(base_dir, 'unknown_faces', id)
    known_faces_old_path = os.path.join(base_dir, 'known_faces', id)
    known_faces_new_path = os.path.join(base_dir, 'known_faces', new_name)
    face_images_path = xml_config.FACE_IMAGES_PATH

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

# Route to get an image by path
@camera_bp.route("/images/<path:image_path>", methods=["GET"])
def get_image(image_path):
    full_path = os.path.join(os.getcwd(), image_path)
    try:
        return send_file(full_path, mimetype="image/jpeg")
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404

# Route to get face image by name
@camera_bp.route("/faces/<image_name>", methods=["GET"])
def get_face_image(image_name):
    # Define the directory to search in and the possible extensions
    search_dir = xml_config.FACE_IMAGES_PATH
    extensions = ['jpg', 'jpeg', 'png']
    
    # Search for files matching the image name with any of the extensions
    for ext in extensions:
        file_pattern = os.path.join(search_dir, f"{image_name}.{ext}")
        matching_files = glob.glob(file_pattern)
        if matching_files:
            return send_file(matching_files[0], mimetype="image/jpeg")
    
    # If no file matches, return an error message
    return jsonify({"error": "Image not found"}), 404

## -------------------------- Personel Face Detection --------------------------

# Route to detect face from uploaded image
@camera_bp.route("/detect_face", methods=["POST"])
def detect_face():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    image_file = request.files['image']
    image_bytes = image_file.read()
    
    image_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    image = cv2.copyMakeBorder(
        image, 
        640, 640, 640, 640, 
        cv2.BORDER_CONSTANT, 
        value=[255, 255, 255]
    )
    
    # Assuming self.face_detector is already defined and initialized
    bboxes, kpss = stream_instance.face_detector.detect(image, input_size=(640, 640), thresh=0.5, max_num=1)
    
    if bboxes is None or len(bboxes) == 0:
        return jsonify({"error": "No face detected"}), 400
    
    # Convert detection results to a JSON-serializable format
    detection_results = {
        "bboxes": bboxes.tolist(),
        "kpss": kpss.tolist()
    }
    
    return jsonify(detection_results), 200



# Register Blueprint
app.register_blueprint(camera_bp)

# Initialize JWTManager
jwt = JWTManager(app)

# Initialize Socket.IO
socketio.init_app(app, cors_allowed_origins=xml_config.CORS_ORIGINS)

if __name__ == "__main__":
    socketio.run(app, host=xml_config.HOST, port=int(xml_config.PORT))

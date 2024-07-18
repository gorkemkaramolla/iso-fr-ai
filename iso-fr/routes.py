import base64
import glob
import json
import shutil
import bson
import bson.json_util
from flask import Flask, Blueprint, request, jsonify, Response, send_file
import flask.json.provider as provider
from pymongo import DESCENDING, MongoClient
# from services.camera_processor.camera_processor import CameraProcessor
from services.camera_processor.Stream import Stream
# from services.camera_processor.enums.camera import Camera
from logger import configure_logging
from flask_cors import CORS
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

# jwt = JWTManager(app)

###################################################### Setup MongoDB
client = MongoClient(os.environ.get("MONGO_DB_URI"))
db = client[os.environ.get("MONGO_DB_NAME")]
logs_collection = db["logs"]
camera_collection = db["cameras"]
#######################################################Setup ElasticSearch

###################################################### Create an instance of your class
# camera_processor = CameraProcessor(device="cuda")
stream_instance = Stream(device="cpu")
logger = configure_logging()

# Setup Blueprint
camera_bp = Blueprint("camera_bp", __name__)


#########################CAMERA ROUTES###############################################


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
    # print("Camera: ", camera)
    # print("Quality: ", quality)
    return Response(
        stream_instance.recog_face_ip_cam(
            stream_id,
            camera=camera,
            quality=quality,
            is_recording=is_recording,
        ),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

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
    result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
    if result.matched_count == 0:
        return jsonify({"error": "Log not found"}), 404
  
    # Determine the correct source folder path
    base_dir = os.path.join('recog')
    unknown_faces_path = os.path.join(base_dir, 'unknown_faces', id)
    known_faces_path = os.path.join(base_dir, 'known_faces', id)
    if os.path.exists(unknown_faces_path):
        old_folder_path = unknown_faces_path
    elif os.path.exists(known_faces_path):
        old_folder_path = known_faces_path
    else:
        return jsonify({"error": "Image folder not found"}), 404

    new_folder_path = os.path.join(base_dir, 'known_faces', new_name)

    try:
        # Check if the target directory exists
        if not os.path.exists(new_folder_path):
            os.makedirs(new_folder_path)
        
        # Rename and move files from old to new folder
        for file_name in os.listdir(old_folder_path):
            if file_name.startswith(id):
                # Construct the new file name by replacing id with new_name
                new_file_name = file_name.replace(id, new_name, 1)
                src_file_path = os.path.join(old_folder_path, file_name)
                dst_file_path = os.path.join(new_folder_path, new_file_name)
                
                # Move the file with the new name
                shutil.move(src_file_path, dst_file_path)
            else:
                # If the file does not start with id, move it without renaming
                src_file_path = os.path.join(old_folder_path, file_name)
                dst_file_path = os.path.join(new_folder_path, file_name)
                shutil.move(src_file_path, dst_file_path)

        # Remove the old folder if it's empty
        if not os.listdir(old_folder_path):
            os.rmdir(old_folder_path)

        # Update the image paths in the database
        logs_collection.update_many(
            {"label": new_name},
            [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": id, "replacement": new_name}}}},
             {"$set": {"image_path": {"$replaceOne": {"input": "$image_path", "find": "unknown_faces", "replacement": "known_faces"}}}}
             
             ]
        )
    except FileNotFoundError:
        return jsonify({"error": "Folder not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200@camera_bp.route("/recog/name/<id>", methods=["PUT"])

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
        
#         # Move files from old to new folder
#         for file_name in os.listdir(old_folder_path):
#             src_file_path = os.path.join(old_folder_path, file_name)
#             dst_file_path = os.path.join(new_folder_path, file_name)
#             shutil.move(src_file_path, dst_file_path)

#         # Remove the old folder if it's empty
#         if not os.listdir(old_folder_path):
#             os.rmdir(old_folder_path)

#         # Update the image paths in the database
#         logs_collection.update_many(
#             {"label": new_name},
#             [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": id, "replacement": new_name}}}}]
#         )
#     except FileNotFoundError:
#         return jsonify({"error": "Folder not found"}), 404
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200

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

#     # Correctly handle folder paths
#     base_dir_known = os.path.join('recog', 'known_faces')
#     base_dir_unknown = os.path.join('recog', 'unknown_faces')
#     old_folder_path = os.path.join(base_dir_unknown, id)
#     new_folder_path = os.path.join(base_dir_known, new_name)

#     try:
#         # Check if the target directory exists
#         if not os.path.exists(new_folder_path):
#             os.makedirs(new_folder_path)
        
#         # Copy files from old to new folder
#         for file_name in os.listdir(old_folder_path):
#             src_file_path = os.path.join(old_folder_path, file_name)
#             dst_file_path = os.path.join(new_folder_path, file_name)
#             shutil.copy(src_file_path, dst_file_path)

#         # Update the image paths in the database using an aggregation pipeline
#         logs_collection.update_many(
#             {"label": new_name},
#             [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": f"unknown_faces/{id}/", "replacement": f"known_faces/{new_name}/"}}}}]
#         )
#     except FileNotFoundError:
#         return jsonify({"error": "Folder not found"}), 404
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200

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

#     # Correctly handle folder paths
#     base_dir_known = os.path.join('recog', 'known_faces')
#     base_dir_unknown = os.path.join('recog', 'unknown_faces')
#     old_folder_path = os.path.join(base_dir_unknown, id)  # Changed to unknown_faces
#     new_folder_path = os.path.join(base_dir_known, new_name)  # Target is known_faces
    
#     try:
#         # Move the directory if it exists, handle existing target
#         if os.path.exists(old_folder_path):
#             if os.path.exists(new_folder_path):
#                 shutil.rmtree(new_folder_path)
#             shutil.move(old_folder_path, new_folder_path)

#         # Update the image paths in the database using an aggregation pipeline
#         logs_collection.update_many(
#             {"label": new_name},
#             [{"$set": {"image_path": {"$replaceAll": {"input": "$image_path", "find": f"unknown_faces/{id}/", "replacement": f"known_faces/{new_name}/"}}}}]
#         )
#     except FileNotFoundError:
#         return jsonify({"error": "Folder not found"}), 404
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200


# @camera_bp.route("/recog/name/<id>", methods=["PUT"])
# def update_recog_name(id):
#     data = request.json
#     new_name = data.get("name")
#     if not new_name:
#         return jsonify({"error": "Name is required"}), 400

#     # Update the name in the database
#     result = logs_collection.update_many({"label": id}, {"$set": {"label": new_name}})
#     if result.matched_count == 0:
#         return jsonify({"error": "Log not found"}), 404

#     # Copy and rename the folder
#     base_dir = os.path.join('recog', 'known_faces')
#     old_folder_path = os.path.join(base_dir, id)
#     new_folder_path = os.path.join(base_dir, new_name)
    
#     try:
#         # Copy the directory if it exists
#         if os.path.exists(old_folder_path):
#             shutil.copytree(old_folder_path, new_folder_path)
        
#         # Rename the folder
#         os.rename(old_folder_path, new_folder_path)

#         # Update the image paths in the database
#         logs_collection.update_many(
#             {"label": new_name},
#             {"$set": {"image_path": {"$replaceOne": {"input": "$image_path", "find": id, "replacement": new_name}}}}
#         )
#     except FileNotFoundError:
#         return jsonify({"error": "Folder not found"}), 404
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     return jsonify({"message": "Name, folder, and image paths updated successfully"}), 200



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


# #########################CAMERA ROUTES###############################################

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
#         camera_processor.generate(
#             stream_id,
#             camera=camera,
#             quality=quality,
#             is_recording=is_recording,
#         ),
#         mimetype="multipart/x-mixed-replace; boundary=frame",
#     )


# @camera_bp.route("/recog", methods=["GET"])
# def get_all_logs():
#     logs = list(logs_collection.find({}, {}))  # Exclude _id from the results
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


# @camera_bp.route("/images/<path:image_path>", methods=["GET"])
# def get_image(image_path):
#     full_path = os.path.join(os.getcwd(), image_path)
#     try:
#         return send_file(full_path, mimetype="image/jpeg")
#     except FileNotFoundError:
#         return jsonify({"error": "Image not found"}), 404


# @camera_bp.route("/faces/<path:image_path>", methods=["GET"])
# def get_face_image(image_path):
#     full_path = os.path.join(os.getcwd(), image_path)
#     try:
#         return send_file(full_path, mimetype="image/jpeg")
#     except FileNotFoundError:
#         return jsonify({"error": "Image not found"}), 404


# # @camera_bp.route("/camera/<int:cam_id>", methods=["GET"])
# # # @jwt_required()
# # def local_camera(cam_id):

# #     return Response(
# #         camera_processor.local_camera_stream(cam_id, request.args.get("quality")),
# #         mimetype="multipart/x-mixed-replace; boundary=frame",
# #     )


# app.register_blueprint(camera_bp)


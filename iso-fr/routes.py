import json
import bson
import bson.json_util
from flask import Flask, Blueprint, request, jsonify, Response, send_file
import flask.json.provider as provider
from pymongo import MongoClient
from services.camera_processor.camera_processor import CameraProcessor
from services.camera_processor.enums.camera import Camera
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
from bson.errors import InvalidId

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
collection = db["logs"]
camera_collection= db["camera"]
logs_collection = db["logs_collection"]
###################################################### Create an instance of your class
camera_processor = CameraProcessor(device="cpu")


# Setup Blueprint
camera_bp = Blueprint("camera_bp", __name__)
auth_bp = Blueprint("auth_bp", __name__)

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




@camera_bp.route("/add_sample", methods=["GET"])
def add_sample():
    response = camera_processor.add_sample_records_to_db()
    return jsonify(response), 200

############################
@camera_bp.route("/get-detections", methods=["GET"])
def get_detected_faces():
    response = camera_processor.get_detected_faces()
    return jsonify(response), 200

@camera_bp.route("/camera-url", methods=["POST"])
# @jwt_required()
def add_camera_url():
    data = request.json
    label = data.get("label")
    url = data.get("url")
    if not label or not url:
        return jsonify({"error": "Label and URL are required"}), 400

    camera_collection.insert_one({"label": label, "url": url})

    return jsonify({"message": "Camera URL added successfully"}), 200


@camera_bp.route("/camera-urls", methods=["GET"])
# @jwt_required()
def get_camera_urls():
    cameras = list(camera_collection.find({}))
    print(cameras)
    return bson.json_util.dumps(cameras), 200

@camera_bp.route("/camera/stop", methods=["GET"])
def stop_camera():
    camera_processor.stop_camera()
    return jsonify({"message": "Camera stopped successfully"}), 200

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
    quality = request.args.get("quality")
    return Response(
        camera_processor.generate(
            stream_id,
            camera=camera,
            quality=quality,
            is_recording=is_recording,
        ),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )
    
# @camera_bp.route("/images/<path:image_path>", methods=["GET"])
# def get_image(image_path):
#     directory = '/Users/gorkemkaramolla/Documents/python2/oracle' 
#     return send_from_directory(directory, image_path)

@camera_bp.route("/images/<path:image_path>", methods=["GET"])
def get_image(image_path):
    full_path = os.path.join(os.getcwd(), image_path)
    try:
        return send_file(full_path, mimetype="image/jpeg")
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404

@camera_bp.route("/person/<person_id>", methods=["GET"])
def get_person_by_id(person_id):
    collection = db["Person"]

    try:
        person = collection.find_one({"_id": ObjectId(person_id)})
    except InvalidId:
        return jsonify({"error": "Invalid ID format"}), 400

    if person:
        person['_id'] = str(person['_id'])
        return jsonify(person), 200
    else:
        return jsonify({"message": "Person not found"}), 404
@camera_bp.route("/person/getall", methods=["GET"])
def get_all_persons():
    collection = db["Person"]
    try:
        persons = list(collection.find({}))
        # Convert ObjectId to string for JSON serialization
        for person in persons:
            person['_id'] = str(person['_id'])
        return jsonify(persons), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@camera_bp.route("/recog", methods=["GET"])
def get_all_logs():
    logs = list(logs_collection.find({}, {}))  # Exclude _id from the results
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



app.register_blueprint(camera_bp)

# ----------------------------Run the app
# if __name__ == "__main__":
#     app.run(debug=True, threaded=True, port=5004)

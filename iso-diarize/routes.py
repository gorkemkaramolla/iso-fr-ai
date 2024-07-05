import os
from flask import Flask, Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required
from flask_cors import CORS
from pymongo import MongoClient
from services.speaker_diarization import SpeakerDiarizationProcessor
from logger import configure_logging

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Enable CSRF protection in production

CORS(app, origins="*")

jwt = JWTManager(app)

###################################################### Setup MongoDB
client = MongoClient(os.environ.get("MONGO_DB_URI"))
db = client[os.environ.get("MONGO_DB_NAME")]
logs_collection = db["logs"]
camera_collection = db["cameras"]

###################################################### Create an instance of your class
diarization_processor = SpeakerDiarizationProcessor(device="cpu")
logger = configure_logging()

# Setup Blueprint
audio_bp = Blueprint("audio_bp", __name__)

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
        del active_requests[client_id] 

@audio_bp.route("/hello", methods=["GET"])
@jwt_required()
def hello_route():
    return "Hello", 200

@audio_bp.route("/transcriptions/", defaults={"id": None}, methods=["GET"])
@audio_bp.route("/transcriptions/<id>", methods=["GET"])
@jwt_required()
def get_transcription_route(id):
    try:
        if id is None:
            response = diarization_processor.get_all_transcriptions()
        else:
            response = diarization_processor.get_transcription(id)
        return jsonify(response)
    except TypeError as e:
        logger.error(f"TypeError in get_transcription_route: {e}")
        return jsonify({"error": "Response is not JSON serializable"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in get_transcription_route: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@audio_bp.route("/rename_segments/<transcription_id>/<old_name>/<new_name>", methods=["POST"])
@jwt_required()
def rename_segments_route(transcription_id, old_name, new_name):
    result, status_code = diarization_processor.rename_segments(transcription_id, old_name, new_name)
    return jsonify(result), status_code

app.register_blueprint(audio_bp)

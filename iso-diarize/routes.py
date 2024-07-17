# routes.py
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
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

CORS(app, origins="*")

jwt = JWTManager(app)

client = MongoClient(os.environ.get("MONGO_DB_URI"))
db = client[os.environ.get("MONGO_DB_NAME")]
logs_collection = db["logs"]
camera_collection = db["cameras"]

diarization_processor = SpeakerDiarizationProcessor(device="cpu")
logger = configure_logging()

audio_bp = Blueprint("audio_bp", __name__)

@audio_bp.route("/process-audio/", methods=["POST"])
@jwt_required()
def process_audio_route():
    response = diarization_processor.process_audio()
    return jsonify(response), 200 if "error" not in response else 500

@audio_bp.route("/hello", methods=["GET"])
@jwt_required()
def hello_route():
    return "Hello", 200

@audio_bp.route("/transcriptions/", defaults={"id": None}, methods=["GET"])
@audio_bp.route("/transcriptions/<id>", methods=["GET"])
@jwt_required()
def get_transcription_route(id):
    if id is None:
        response = diarization_processor.get_all_transcriptions()
    else:
        response = diarization_processor.get_transcription(id)
    return jsonify(response), 200 if "error" not in response else 500

@audio_bp.route("/rename_segments/<transcription_id>/<old_name>/<new_name>", methods=["POST"])
@jwt_required()
def rename_segments_route(transcription_id, old_name, new_name):
    result = diarization_processor.rename_segments(transcription_id, old_name, new_name)
    return jsonify(result), 200

app.register_blueprint(audio_bp)
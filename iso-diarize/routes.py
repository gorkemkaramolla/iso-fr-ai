# import os
# from flask import Flask, Blueprint, request, jsonify, abort, Response
# from flask_jwt_extended import JWTManager, jwt_required
# from flask_cors import CORS
# from pymongo import MongoClient
# from services.speaker_diarization import SpeakerDiarizationProcessor
# from logger import configure_logging

# app = Flask(__name__)
# app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
# app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
# app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
# app.config["JWT_COOKIE_SECURE"] = False
# app.config["JWT_COOKIE_CSRF_PROTECT"] = False

# CORS(app, supports_credentials=True, origins="*")

# jwt = JWTManager(app)

# client = MongoClient(os.environ.get("MONGO_DB_URI"))
# db = client[os.environ.get("MONGO_DB_NAME")]
# logs_collection = db["logs"]
# camera_collection = db["cameras"]

# diarization_processor = SpeakerDiarizationProcessor(device="cpu")
# logger = configure_logging()

# audio_bp = Blueprint("audio_bp", __name__)

# @audio_bp.route("/process-audio/", methods=["POST"])
# @jwt_required()
# def process_audio_route():
#     response = diarization_processor.process_audio()
#     return jsonify(response), 200 if "error" not in response else 500

# @audio_bp.route("/hello", methods=["GET"])
# @jwt_required()
# def hello_route():
#     return "Hello", 200

# @audio_bp.route("/transcriptions/", defaults={"id": None}, methods=["GET"])
# @audio_bp.route("/transcriptions/<id>", methods=["GET"])
# @jwt_required()
# def get_transcription_route(id):
#     if id is None:
#         response = diarization_processor.get_all_transcriptions()
#     else:
#         response = diarization_processor.get_transcription(id)
#     return jsonify(response), 200 if "error" not in response else 500

# # @audio_bp.route("/rename_segments/<transcription_id>/<old_name>/<new_name>", methods=["POST"])
# # @jwt_required()
# # def rename_segments_route(transcription_id, old_name, new_name):
# #     result = diarization_processor.rename_segments(transcription_id, old_name, new_name)
# #     return jsonify(result), 200

# # @audio_bp.route("/rename_transcribed_text/<transcription_id>/<old_text>/<new_text>", methods=["POST"])
# # @jwt_required()
# # def rename_transcribed_text_route(transcription_id, old_text, new_text):
# #     print(f'Received transcription_id: {transcription_id}')
# #     print(f'Received old_text: {old_text}')
# #     print(f'Received new_text: {new_text}')
# #     result = diarization_processor.rename_transcribed_text(transcription_id, old_text, new_text)
# #     return jsonify(result), 200

# ############################################################################################
# @audio_bp.route("/rename_segments/<transcription_id>/<old_name>/<new_name>", methods=["POST"])
# @jwt_required()
# def rename_segments_route(transcription_id, old_name, new_name):
#     data = request.json
#     segment_ids = data.get("segment_ids", None)
    
#     if segment_ids:
#         result = diarization_processor.rename_selected_segments(transcription_id, old_name, new_name, segment_ids)
#     else: 
#         result = diarization_processor.rename_segments(transcription_id, old_name, new_name)
    
#     return jsonify(result), 200 if result["status"] == "success" else 500

# @audio_bp.route("/rename_transcribed_text/<transcription_id>/<old_text>/<new_text>", methods=["POST"])
# @jwt_required()
# def rename_transcribed_text_route(transcription_id, old_text, new_text):
#     data = request.json
#     segment_ids = data.get("segment_ids", None)
    
#     if segment_ids:
#         result = diarization_processor.rename_selected_texts(transcription_id, old_text, new_text, segment_ids)
#     else:
#         result = diarization_processor.rename_transcribed_text(transcription_id, old_text, new_text)
    
#     return jsonify(result), 200 if result["status"] == "success" else 500

# @audio_bp.route("/delete_segments/<transcription_id>", methods=["POST"])
# @jwt_required()
# def delete_segments_route(transcription_id):
#     data = request.json
#     segment_ids = data.get("segment_ids", [])
#     result = diarization_processor.delete_segments(transcription_id, segment_ids)
    
#     return jsonify(result), 200 if result["status"] == "success" else 500

# #######################################################################

# @audio_bp.route("/stream-audio/<transcription_id>", methods=["GET"])
# @jwt_required()
# def stream_audio_route(transcription_id):
#     try:
#         # Get the path to the WAV file
#         wav_file_path = os.path.join("temp", f"{transcription_id}.wav")
        
#         # Check if the file exists
#         if not os.path.exists(wav_file_path):
#             abort(404, description="Resource not found")

#         # Stream the file in chunks
#         def generate():
#             with open(wav_file_path, "rb") as f:
#                 chunk = f.read(4096)
#                 while chunk:
#                     yield chunk
#                     chunk = f.read(4096)

#         return Response(generate(), mimetype="audio/wav")

#     except Exception as e:
#         logger.exception("Failed to stream audio")
#         return jsonify({"error": str(e)}), 500

# app.register_blueprint(audio_bp)
import os
from flask import Flask, Blueprint, request, jsonify, abort, Response
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

CORS(app, supports_credentials=True, origins="*")

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

@audio_bp.route("/transcriptions/<id>", methods=["DELETE"])
@jwt_required()
def delete_transcription_route(id):
    if id is None:
        return jsonify({"message": "ID is required"}), 404
    
    try:
        response = diarization_processor.delete_transcription(id)
        if "error" in response:
            return jsonify(response), 500
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500




@audio_bp.route("/rename_segments/<transcription_id>", methods=["POST"])
@jwt_required()
def rename_segments_route(transcription_id):
    data = request.json
    old_names = data.get("old_names")
    new_name = data.get("new_name")
    segment_ids = data.get("segment_ids")
    
    if segment_ids:
        result = diarization_processor.rename_selected_segments(transcription_id, old_names, new_name, segment_ids)
    else:
        result = diarization_processor.rename_segments(transcription_id, old_names, new_name)
    
    return jsonify(result), 200 if result["status"] == "success" else 500

@audio_bp.route("/rename_transcribed_text/<transcription_id>", methods=["POST"])
@jwt_required()
def rename_transcribed_text_route(transcription_id):
    data = request.json
    old_texts = data.get("old_texts")
    new_text = data.get("new_text")
    segment_ids = data.get("segment_ids")
    
    if segment_ids:
        result = diarization_processor.rename_selected_texts(transcription_id, old_texts, new_text, segment_ids)
    else:
        result = diarization_processor.rename_transcribed_text(transcription_id, old_texts, new_text)
    
    return jsonify(result), 200 if result["status"] == "success" else 500

@audio_bp.route("/delete_segments/<transcription_id>", methods=["POST"])
@jwt_required()
def delete_segments_route(transcription_id):
    data = request.json
    segment_ids = data.get("segment_ids", [])
    result = diarization_processor.delete_segments(transcription_id, segment_ids)
    
    return jsonify(result), 200 if result["status"] == "success" else 500

@audio_bp.route("/stream-audio/<transcription_id>", methods=["GET"])
@jwt_required()
def stream_audio_route(transcription_id):
    try:
        wav_file_path = os.path.join("temp", f"{transcription_id}.wav")
        
        if not os.path.exists(wav_file_path):
            abort(404, description="Resource not found")

        def generate():
            with open(wav_file_path, "rb") as f:
                chunk = f.read(4096)
                while chunk:
                    yield chunk
                    chunk = f.read(4096)

        return Response(generate(), mimetype="audio/wav")

    except Exception as e:
        logger.exception("Failed to stream audio")
        return jsonify({"error": str(e)}), 500

app.register_blueprint(audio_bp)


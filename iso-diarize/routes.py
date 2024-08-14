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
from threading import Lock
from flask import Flask, Blueprint, request, jsonify, abort, Response
from flask_jwt_extended import JWTManager, jwt_required,get_jwt_identity
from flask_cors import CORS
from pymongo import MongoClient
from services.speaker_diarization import SpeakerDiarizationProcessor
from logger import configure_logging
from config import XMLConfig  # Import the XML configuration
import torch
app = Flask(__name__)
xml_config = XMLConfig(service_name='speaker_diarization_service')
xml_mongo_config = XMLConfig(service_name='mongo')

# Configure JWT using XML config
app.config["JWT_SECRET_KEY"] = xml_config.JWT_SECRET_KEY
app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
app.config["JWT_ACCESS_COOKIE_PATH"] = xml_config.JWT_ACCESS_COOKIE_PATH
app.config["JWT_REFRESH_COOKIE_PATH"] = xml_config.JWT_REFRESH_COOKIE_PATH
app.config["JWT_COOKIE_SECURE"] = xml_config.JWT_COOKIE_SECURE  # Set to False in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = xml_config.JWT_COOKIE_CSRF_PROTECT  # Enable CSRF protection in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = xml_config.get_jwt_expire_timedelta()
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = xml_config.get_jwt_refresh_expire_timedelta()


# Configure CORS using XML config
CORS(app, supports_credentials=xml_config.SUPPORTS_CREDENTIALS, origins=xml_config.CORS_ORIGINS)

# Initialize JWT Manager
jwt = JWTManager(app)

# Setup MongoDB using XML config
client = MongoClient(xml_mongo_config.MONGO_DB_URI)
db = client[xml_mongo_config.MONGO_DB_NAME]
logs_collection = db[xml_config.LOGGING_COLLECTION]


# Initialize the Speaker Diarization Processor with the configured device
if torch.cuda.is_available():
    print("CUDA is available. Using GPU.")
    x = torch.device("cuda")
else:
    print("CUDA is not available. Using CPU.")
    x = torch.device("cpu")
    
diarization_processor = SpeakerDiarizationProcessor(device=xml_config.DEVICE)

# Initialize logger
logger = configure_logging()

# Setup Blueprint
audio_bp = Blueprint("audio_bp", __name__)
processing_flags = {}
lock = Lock()
def set_processing_flag(user_id):
    with lock:
        processing_flags[user_id] = True

def clear_processing_flag(user_id):
    with lock:
        if user_id in processing_flags:
            del processing_flags[user_id]

def is_processing(user_id):
    return processing_flags.get(user_id, False)

@audio_bp.route("/process-audio/", methods=["POST"])
@jwt_required()
def process_audio_route():
    identity = get_jwt_identity()  # This returns a dictionary
    username = identity.get("username")  # Extract the unique user identifier
    
    if not username:
        return jsonify({"error": f"Invalid user identity {identity}"}), 400
    if is_processing(username):
        return jsonify({"error": "A process is already running"}), 429

    set_processing_flag(username)
    try:
        response = diarization_processor.process_audio()
        return jsonify(response), 200 if "error" not in response else 500
    finally:
        clear_processing_flag(username)

        
@audio_bp.route("/check-process/", methods=["GET"], strict_slashes=False)
@jwt_required()
def check_process_route():
    identity = get_jwt_identity()  # This returns a dictionary
    username = identity.get("username")  # Extract the username
    
    if not username:
        return jsonify({"error": f"Invalid user identity: {identity}"}), 400
    
    if is_processing(username):
        return jsonify({"processing": True}), 200
    else:
        return jsonify({"processing": False}), 200



# @audio_bp.route("/process-audio/", methods=["POST"])
# @jwt_required()
# def process_audio_route():
#     response = diarization_processor.process_audio()
#     return jsonify(response), 200 if "error" not in response else 500


@audio_bp.route("/hello", methods=["GET"])
@jwt_required()
def hello_route():
    #CHECK CUDA

    # Check if CUDA is available
    if torch.cuda.is_available():
        print("CUDA is available. Using GPU.")
        x = torch.device("cuda")
    else:
        print("CUDA is not available. Using CPU.")
        x = torch.device("cpu")
        logger.info(f"Running on device: {x}")
    return "Hello", 200

@audio_bp.route("/transcriptions/", defaults={"id": None}, methods=["GET"])
@audio_bp.route("/transcriptions/<id>", methods=["GET"])
# @jwt_required()
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
    
    
@audio_bp.route("/transcriptions/<id>", methods=["PUT"])
@jwt_required()
def rename_transcription_route(id):
    if id is None:
        return jsonify({"message": "ID is required"}), 404

    data = request.get_json()
    new_name = data.get('name')
    
    if not new_name:
        return jsonify({"message": "New name is required"}), 400

    try:
        response = diarization_processor.rename_transcription(id, new_name)
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

    # Debugging: Log the incoming data
    logger.debug(f"Received data: old_names={old_names}, new_name={new_name}, segment_ids={segment_ids}")

    # Ensure segment_ids is a list
    if not isinstance(segment_ids, list):
        segment_ids = [segment_ids]
    
    try:
        # Ensure segment_ids is still a list here before passing to the processor
        if not isinstance(segment_ids, list):
            raise ValueError("segment_ids must be a list")
            
        result = diarization_processor.rename_selected_segments(transcription_id, old_names, new_name, segment_ids)
        logger.debug(f"Renaming segments result: {result}")
    except Exception as e:
        logger.error(f"Error renaming segments: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
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
        wav_file_path = os.path.join(xml_config.TEMP_DIRECTORY, f"{transcription_id}.wav")
        
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


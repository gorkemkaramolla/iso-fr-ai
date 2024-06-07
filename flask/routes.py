from flask import Flask, Blueprint, request, jsonify, Response
from services.speaker_diarization import SpeakerDiarizationProcessor
from services.system_monitoring import SystemMonitoring
from services.camera_processor.camera_processor import CameraProcessor
from services.camera_processor.enums.camera import Camera
from logger import configure_logging
from flask_cors import CORS
from auth.auth_provider import AuthProvider
from flask_jwt_extended import jwt_required, JWTManager
import os
from datetime import timedelta

app = Flask(__name__)
CORS(app, origins="*")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(minutes=2)
jwt = JWTManager(app)

# Create an instance of your class
diarization_processor = SpeakerDiarizationProcessor(device="cuda")
camera_processor = CameraProcessor(device="cuda")
logger = configure_logging()
system_monitoring_instance = SystemMonitoring()


# Setup Blueprint
audio_bp = Blueprint("audio_bp", __name__)
camera_bp = Blueprint("camera_bp", __name__)
system_check = Blueprint("system_check", __name__)
auth_bp = Blueprint("auth_bp", __name__)


# Register Auth Provider
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


# camera url routes
camera_urls = camera_processor.read_camera_urls()


@camera_bp.route("/camera-url", methods=["POST"])
# @jwt_required()
def add_camera_url():
    data = request.json
    label = data.get("label")
    url = data.get("url")
    if not label or not url:
        return jsonify({"error": "Label and URL are required"}), 400

    camera_urls[label] = url
    camera_processor.write_camera_urls(camera_urls)

    return jsonify({"message": "Camera URL added successfully"}), 200


@camera_bp.route("/camera-urls", methods=["GET"])
# @jwt_required()
def get_camera_urls():
    return jsonify(camera_urls), 200


@camera_bp.route("/camera-url/<label>", methods=["DELETE"])
# @jwt_required()
def delete_camera_url(label):
    if label not in camera_urls:
        return jsonify({"error": "Camera label not found"}), 404

    del camera_urls[label]
    camera_processor.write_camera_urls(camera_urls)

    return jsonify({"message": "Camera URL deleted successfully"}), 200


# ****************************************************************************
@camera_bp.route("/stream/<int:stream_id>", methods=["GET"])
# @jwt_required()
def stream(stream_id):
    is_recording = request.args.get("is_recording") == "true"

    return Response(
        camera_processor.stream(
            stream_id,
            request.args.get("camera"),
            request.args.get("quality"),
            is_recording,
        ),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@camera_bp.route("/camera/<int:cam_id>", methods=["GET"])
# @jwt_required()
def local_camera(cam_id):

    return Response(
        camera_processor.local_camera_stream(cam_id, request.args.get("quality")),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


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
if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5004)

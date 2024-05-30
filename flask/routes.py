from flask import Flask, Blueprint, request, jsonify,Response
from services.speaker_diarization import SpeakerDiarizationProcessor
from services.system_monitoring import SystemMonitoring
from services.camera_processor.camera_processor import CameraProcessor
from services.camera_processor.enums.camera import Camera
from logger import configure_logging
import os
import platform
import time
from threading import Thread
from flask_cors import CORS
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins="*")
CORS(app, origins="*")
# Create an instance of your class
diarization_processor = SpeakerDiarizationProcessor(device="cpu")
camera_processor = CameraProcessor(device="cpu")
logger = configure_logging()
system_monitoring_instance = SystemMonitoring()

import re
# Setup Blueprint
audio_bp = Blueprint('audio_bp', __name__)
camera_bp = Blueprint('camera_bp', __name__)
system_check = Blueprint('system_check', __name__)

camera_urls = camera_processor.read_camera_urls()

# camera url routes
@camera_bp.route('/camera-url', methods=['POST'])
def add_camera_url():
    data = request.json
    label = data.get('label')
    url = data.get('url')
    if not label or not url:
        return jsonify({'error': 'Label and URL are required'}), 400
    
    camera_urls[label] = url
    camera_processor.write_camera_urls(camera_urls)

    return jsonify({'message': 'Camera URL added successfully'}), 200

@camera_bp.route('/camera-urls', methods=['GET'])
def get_camera_urls():
    return jsonify(camera_urls), 200

@camera_bp.route('/camera-url/<label>', methods=['DELETE'])
def delete_camera_url(label):
    if label not in camera_urls:
        return jsonify({'error': 'Camera label not found'}), 404
    
    del camera_urls[label]
    camera_processor.write_camera_urls(camera_urls)

    return jsonify({'message': 'Camera URL deleted successfully'}), 200
# ----------------------------

camera_urls = camera_processor.read_camera_urls()

# camera url routes
@camera_bp.route('/camera-url', methods=['POST'])
def add_camera_url():
    data = request.json
    label = data.get('label')
    url = data.get('url')
    if not label or not url:
        return jsonify({'error': 'Label and URL are required'}), 400
    
    camera_urls[label] = url
    camera_processor.write_camera_urls(camera_urls)

    return jsonify({'message': 'Camera URL added successfully'}), 200

@camera_bp.route('/camera-urls', methods=['GET'])
def get_camera_urls():
    return jsonify(camera_urls), 200

@camera_bp.route('/camera-url/<label>', methods=['DELETE'])
def delete_camera_url(label):
    if label not in camera_urls:
        return jsonify({'error': 'Camera label not found'}), 404
    
    del camera_urls[label]
    camera_processor.write_camera_urls(camera_urls)

    return jsonify({'message': 'Camera URL deleted successfully'}), 200
# ----------------------------


# # Start the thread to send system info

@app.route("/system_check/", methods=["GET"])
def system_check_route():
    system_info = system_monitoring_instance.send_system_info()
    return jsonify(system_info)




active_requests = {}
@audio_bp.route("/process-audio/", methods=["POST"])
def process_audio_route():
    client_id = request.headers.get("X-Client-ID")
    if not client_id:
        return jsonify({'error': 'Client ID is required'}), 400

    if client_id in active_requests:
        return jsonify({'error': 'Another process is still running'}), 429

    active_requests[client_id] = True
    try:
        response = diarization_processor.process_audio(client_id)
        return response
    finally:
        del active_requests[client_id]  # Ensure to clear the flag irrespective of success or failure

@audio_bp.route("/transcriptions/", defaults={'id': None}, methods=["GET"])
@audio_bp.route("/transcriptions/<int:id>", methods=["GET"])
def get_transcription_route(id):
    if id is None:
        # Get all transcriptions
        response = diarization_processor.get_all_transcriptions()
    else:
        # Get transcription with the specified id
        response = diarization_processor.get_transcription(id)
    return response

@audio_bp.route("/rename_segments/<int:transcription_id>/<old_name>/<new_name>", methods=["POST"])
def rename_segments_route(transcription_id, old_name, new_name):
    result, status_code = diarization_processor.rename_segments(transcription_id, old_name, new_name)
    return jsonify(result), status_code

app.register_blueprint(audio_bp)

@camera_bp.route('/stream/<int:stream_id>', methods=["GET"])
def stream(stream_id):
    return Response(camera_processor.stream(stream_id, request.args.get('camera'), request.args.get('quality')), mimetype='multipart/x-mixed-replace; boundary=frame')

@camera_bp.route('/camera/<int:cam_id>')
def local_camera(cam_id) :
    return Response(camera_processor.local_camera_stream(cam_id), mimetype='multipart/x-mixed-replace; boundary=frame');
     
app.register_blueprint(camera_bp)

if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5004)
    app.run(debug=True, threaded=True, port=5004)

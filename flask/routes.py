from flask import Flask, Blueprint, request, jsonify,Response
from services.speaker_diarization import SpeakerDiarizationProcessor
from services.camera_processor.camera_processor import CameraProcessor
from services.camera_processor.enums.camera import Camera
import psutil
import gpustat
import psutil
import subprocess
import xmltodict
from logger import configure_logging
import os
import platform
from socketio_instance import socketio
import time
from threading import Thread
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins="*")
# Create an instance of your class
diarization_processor = SpeakerDiarizationProcessor(device="cuda")
camera_processor = CameraProcessor(device="cuda")
logger = configure_logging()
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

def get_cpu_temp_linux():
    try:
        result = subprocess.run(['sensors'], stdout=subprocess.PIPE, text=True)
        output = result.stdout
        
        core_temps = {}
        matches = re.findall(r'Core\s+\d+:\s+\+([\d.]+)°C', output)
        if matches:
            core_temps = {f"Core {i}": float(temp) for i, temp in enumerate(matches)}
            avg_temp = sum(core_temps.values()) / len(core_temps)
            # logger.info(f"CPU core temperatures: {core_temps}")
            logger.info(f"Average CPU temperature: {avg_temp}°C")
            return avg_temp
        else:
            logger.error("No CPU core temperatures found.")
            return 'N/A'
    except Exception as e:
        logger.error(f"Failed to get CPU temperatures: {e}")
        return 'N/A'
    
def get_cpu_temp_windows():
    try:
        import wmi
        w = wmi.WMI(namespace="root\\OpenHardwareMonitor")
        temperature_infos = w.Sensor()
        for sensor in temperature_infos:
            if sensor.SensorType == u'Temperature' and 'CPU' in sensor.Name:
                logger.info(f"Windows CPU temperature: {sensor.Value}°C")
                return sensor.Value
    except Exception as e:
        logger.info(f"Failed to get Windows CPU temperature: {e}")
    return 'N/A'

def get_cpu_temp():
    if platform.system() == 'Linux':
        return get_cpu_temp_linux()
    elif platform.system() == 'Windows':
        return get_cpu_temp_windows()
    else:
        logger.info(f"Unsupported platform: {platform.system()}")
        return 'N/A'

def get_gpu_stats():
    try:
        result = subprocess.run(['nvidia-smi', '-q', '-x'], capture_output=True, text=True)
        gpu_info = result.stdout
        gpu_data = xmltodict.parse(gpu_info)
        
        logger.info(f"Parsed GPU data: {gpu_data}")
        
        gpu_temp = gpu_data['nvidia_smi_log']['gpu']['temperature']['gpu_temp']
        gpu_usage = gpu_data['nvidia_smi_log']['gpu']['utilization']['gpu_util']
        gpu_memory_total = gpu_data['nvidia_smi_log']['gpu']['fb_memory_usage']['total']
        gpu_memory_used = gpu_data['nvidia_smi_log']['gpu']['fb_memory_usage']['used']
        gpu_memory_usage = f"{gpu_memory_used} MiB / {gpu_memory_total} MiB"
        
        logger.info(f"GPU Temperature: {gpu_temp}°C")
        logger.info(f"GPU Usage: {gpu_usage}%")
        logger.info(f"GPU Memory Usage: {gpu_memory_usage}")

        return gpu_temp, gpu_usage, gpu_memory_usage
    except Exception as e:
        logger.info(f"Failed to get GPU stats: {e}")
        return 'N/A', 'N/A', 'N/A'

def send_system_info():
    while True:
        cpu_temp = get_cpu_temp()
        cpu_usage = psutil.cpu_percent(interval=1)
        gpu_temp, gpu_usage, gpu_memory_usage = get_gpu_stats()
        memory = psutil.virtual_memory()
        memory_usage = f"{memory.used // (1024 ** 3)}GB / {memory.total // (1024 ** 3)}GB"
        
        system_info = {
            'cpu_temperature': cpu_temp,
            'cpu_usage': cpu_usage,
            'gpu_temperature': gpu_temp,
            'gpu_usage': gpu_usage,
            'gpu_memory_usage': gpu_memory_usage,
            'memory_usage': memory_usage
        }

        socketio.emit('system_info', system_info)
        time.sleep(2)  # Send data every 2 seconds

# Start the thread to send system info
thread = Thread(target=send_system_info)
thread.start()

@system_check.route("/system_check/", methods=["GET"])
def system_check_route():
    # Get CPU temperature and usage
    cpu_temp = get_cpu_temp()
    cpu_usage = psutil.cpu_percent(interval=1)
    logger.info(f"CPU Usage: {cpu_usage}%")

    # Get GPU temperature and usage
    gpu_temp, gpu_usage, gpu_memory_usage = get_gpu_stats()

    # Get Memory usage
    memory = psutil.virtual_memory()
    memory_usage = f"{memory.used // (1024 ** 3)}GB / {memory.total // (1024 ** 3)}GB"
    logger.info(f"Memory Usage: {memory_usage}")

    system_info = {
        'cpu_temperature': cpu_temp,
        'cpu_usage': cpu_usage,
        'gpu_temperature': gpu_temp,
        'gpu_usage': gpu_usage,
        'gpu_memory_usage': gpu_memory_usage,
        'memory_usage': memory_usage
    }

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

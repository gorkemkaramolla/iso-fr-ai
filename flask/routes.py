from flask import Flask, Blueprint, request, jsonify,Response
from services.speaker_diarization import SpeakerDiarizationProcessor
from services.camera_processor.camera_processor import CameraProcessor
from services.camera_processor.enums.camera import Camera
import psutil
import gpustat

app = Flask(__name__)

# Create an instance of your class
diarization_processor = SpeakerDiarizationProcessor(device="cpu")
camera_processor = CameraProcessor(device="cpu")


# Setup Blueprint
audio_bp = Blueprint('audio_bp', __name__)
camera_bp = Blueprint('camera_bp', __name__)
system_check = Blueprint('system_check', __name__)


def get_cpu_temp():
    try:
        # This approach works on many Linux systems with lm-sensors installed
        if os.path.exists("/sys/class/thermal/thermal_zone0/temp"):
            with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                temp = int(f.read()) / 1000
            return temp
        else:
            # Fallback for Windows using WMI (requires wmi package)
            import wmi
            w = wmi.WMI(namespace="root\\OpenHardwareMonitor")
            temperature_infos = w.Sensor()
            for sensor in temperature_infos:
                if sensor.SensorType == u'Temperature' and 'CPU' in sensor.Name:
                    return sensor.Value
    except Exception as e:
        return 'N/A'

@system_check.route("/system_check/", methods=["GET"])
def system_check_route():
    # Get CPU temperature and usage
    cpu_temp = get_cpu_temp()
    cpu_usage = psutil.cpu_percent(interval=1)

    # Get GPU temperature and usage
    try:
        gpus = gpustat.new_query().gpus
        gpu_temp = gpus[0].temperature if gpus else 'N/A'
        gpu_usage = gpus[0].utilization if gpus else 'N/A'
    except Exception as e:
        gpu_temp = 'N/A'
        gpu_usage = 'N/A'

    system_info = {
        'cpu_temperature': cpu_temp,
        'cpu_usage': cpu_usage,
        'gpu_temperature': gpu_temp,
        'gpu_usage': gpu_usage
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
    app.run(debug=True, port=5004)

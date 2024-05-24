from flask import Flask, Blueprint, request, jsonify
from services.speaker_diarization import SpeakerDiarizationProcessor

app = Flask(__name__)

# Create an instance of your class
diarization_processor = SpeakerDiarizationProcessor(processor="cpu")

# Setup Blueprint
audio_bp = Blueprint('audio_bp', __name__)

@app.route("/hello/", methods=["GET"])
def hello():
    return "Hello World"

@audio_bp.route("/process-audio/", methods=["POST"])
def process_audio_route():
    # Assuming process_audio doesn't require additional parameters from the request
    response = diarization_processor.process_audio()
    return response

@audio_bp.route("/transcriptions/<int:id>", methods=["GET"])
def get_transcription_route(id):
    # Pass URL parameter to your class method
    response = diarization_processor.get_transcription(id)
    return response

@audio_bp.route("/rename_segments/<int:transcription_id>/<old_name>/<new_name>", methods=["POST"])
def rename_segments_route(transcription_id, old_name, new_name):
    # Pass URL parameters to your class method
    result, status_code = diarization_processor.rename_segments(transcription_id, old_name, new_name)
    return jsonify(result), status_code

# Register Blueprint with the application
app.register_blueprint(audio_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5004)

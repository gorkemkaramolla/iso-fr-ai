from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import whisper
from werkzeug.utils import secure_filename
from pyannote.audio import Pipeline
import json
import os
from datetime import datetime
import uuid  # Import UUID library
from pyannote.audio.pipelines.utils.hook import ProgressHook
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # Adjust CORS as needed

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token="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")

whisper_model = whisper.load_model("large", device="cpu")

# Create directories if they do not exist
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

@app.route("/process-audio/", methods=["POST"])
def process_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filename = secure_filename(file.filename)
    file_path = f"temp/{filename}"
    file.save(file_path)
    
    try:
        total_steps = 5
        current_step = 0

        # Emit initial progress update
        socketio.emit('progress', {'progress': int((current_step / total_steps) * 100)})
        current_step += 1

        # Load audio
        audio_data = whisper.load_audio(file_path)
        socketio.emit('progress', {'progress': int((current_step / total_steps) * 100)})
        current_step += 1

        # diarization = pipeline(file_path,hook=ProgressHook())
        with ProgressHook() as hook:
            diarization = pipeline(file_path, hook=hook)
        socketio.emit('progress', {'progress': int((current_step / total_steps) * 100)})
        current_step += 1

        # Processing segments
        segments = [{
            'start': round(turn.start, 2),
            'end': round(turn.end, 2),
            'speaker': speaker
        } for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)]
        socketio.emit('progress', {'progress': int((current_step / total_steps) * 100)})
        current_step += 1

        # Transcription
        transcription = whisper.transcribe(whisper_model, audio_data, language="tr")
        socketio.emit('progress', {'progress': int((current_step / total_steps) * 100)})
        current_step += 1

        # Save results and emit final progress
        transcription_file = f"{filename}_transcription.txt"
        with open(f"temp/{transcription_file}", 'w') as f:
            f.write(json.dumps(transcription))
        socketio.emit('progress', {'progress': 100})

        # Create response data
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        unique_id = str(uuid.uuid4())
        response_data = {
            'id': unique_id,
            'transcription': transcription,
            'created_at': created_at
        }
        
        return jsonify(response_data), 200
    except Exception as e:
        socketio.emit('progress', {'progress': 0})
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)


# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from werkzeug.utils import secure_filename
# from whisperplus import ASRDiarizationPipeline, format_speech_to_dialogue

# app = Flask(__name__)
# CORS(app)

# # Initialize ASR Diarization Pipeline
# pipeline = ASRDiarizationPipeline.from_pretrained(
#     asr_model="openai/whisper-large-v3",
#     diarizer_model="pyannote/speaker-diarization",
#     use_auth_token="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",
#     chunk_length_s=30,
#     device="cpu"  # ensure you are using the correct device here
# )

# @app.route("/process-audio/", methods=["POST"])
# def process_audio():
#     print("Starting audio processing...")

#     if 'file' not in request.files:
#         return jsonify({'error': 'No file part'}), 400

#     file = request.files['file']

#     if file.filename == '':
#         return jsonify({'error': 'No selected file'}), 400

#     if file:
#         filename = secure_filename(file.filename)
#         file_path = f"temp/{filename}"  # Save file to temp directory
#         file.save(file_path)

#         # Perform diarization and transcription using whisperplus
#         output_text = pipeline(file_path, num_speakers=2, min_speaker=1, max_speaker=4)
#         dialogue = format_speech_to_dialogue(output_text)

#         # Format the dialogue and timings into JSON
#         results = []
#         for entry in dialogue:
#             result = {
#                 "speaker": entry["speaker"],
#                 "start": entry["start"],
#                 "end": entry["end"],
#                 "text": entry["text"]
#             }
#             results.append(result)

#         return jsonify(results), 200

# if __name__ == "__main__":
#     app.run(debug=True, port=5001)

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
from werkzeug.utils import secure_filename
from pyannote.audio import Pipeline
from pyannote.core import Segment
from pydub import AudioSegment
from pyannote.audio.pipelines.utils.hook import ProgressHook
import json
app = Flask(__name__)
CORS(app)

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token="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")

whisper_model = whisper.load_model("large", device="cpu")

@app.route("/process-audio/", methods=["POST"])
def process_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filename = secure_filename(file.filename)
    file_path = f"temp/{filename}"  # Ensure this directory exists or handle file saving appropriately
    file.save(file_path)
    
    try:
        with ProgressHook() as hook:
            diarization = pipeline(file_path, hook=hook)
        segments = [{
            'start': round(turn.start, 2),
            'end': round(turn.end, 2),
            'speaker': speaker
        } for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)]

        print("whisper_started")
        audio_data = whisper.load_audio(file_path)
        transcription = whisper.transcribe(whisper_model, audio_data, language="tr")
        print("whisper ended")
        for segment in transcription['segments']:
            print("Segments part working")
            for speaker_segment in segments:
                if segment['start'] < speaker_segment['end'] and segment['end'] > speaker_segment['start']:
                    segment['speaker'] = speaker_segment['speaker']
                    break

        for segment in transcription['segments']:
            segment.pop('tokens', None)
            segment.pop('temperature', None)
            segment.pop('avg_logprob', None)
            segment.pop('compression_ratio', None)
            segment.pop('no_speech_prob', None)
        with open('transcription.txt', 'w') as f:
            f.write(json.dumps(transcription))
        return jsonify(transcription), 200
    except Exception as e:
        with open('transcriptionErr.txt', 'w') as f:
            f.write(json.dumps(transcription))
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)

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

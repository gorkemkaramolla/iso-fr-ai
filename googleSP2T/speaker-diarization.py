# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from pyannote.audio import Pipeline
# from pyannote.core import Segment
# import whisper
# from werkzeug.utils import secure_filename
# from pydub import AudioSegment

# app = Flask(__name__)
# CORS(app)

# pipeline = Pipeline.from_pretrained(
#     "pyannote/speaker-diarization-3.1",
#     use_auth_token="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")

# # Load Whisper model
# whisper_model = whisper.load_model("large", device="cpu")

# def make_chunks(audio, chunk_length_ms):
#     """
#     Split the audio file into chunks of a specified length
#     """
#     chunks = []
#     for i in range(0, len(audio), chunk_length_ms):
#         chunks.append(audio[i:i + chunk_length_ms])
#     return chunks

# @app.route("/process-audio/", methods=["POST"])

# def process_audio():
#     print("process-audio started")
    
#     if 'file' not in request.files:
#         return jsonify({'error': 'No file part'}), 400
    
#     file = request.files['file']
    
#     if file.filename == '':
#         return jsonify({'error': 'No selected file'}), 400
    
#     if file:
#         filename = secure_filename(file.filename)
#         file_path = f"{filename}"
#         file.save(file_path)
        
#         # Load the audio file
#         audio = AudioSegment.from_file(file_path)

#         # Split the audio file into 30-second chunks
#         chunk_length_ms = 30 * 1000  # length of each audio chunk in milliseconds
#         chunks = make_chunks(audio, chunk_length_ms)

#         results = []

#         # Process each chunk
#         for i, chunk in enumerate(chunks):
#             chunk_path = f"{filename}_chunk{i}.wav"
#             chunk.export(chunk_path, format="wav")
#             print(i,"chunk processing")
#             # Perform diarization
#             diarization = pipeline(chunk_path)
#             speaker_segments = [{
#                 'start': round(turn.start, 2),
#                 'end': round(turn.end, 2),
#                 'speaker': speaker
#             } for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)]

#             # Transcribe audio
#             audio = whisper.load_audio(chunk_path)
#             result = whisper.transcribe(whisper_model, audio, language="tr")

#             # Match speakers
#             for segment in result['segments']:
#                 for speaker_segment in speaker_segments:
#                     if segment['start'] < speaker_segment['end'] and segment['end'] > speaker_segment['start']:
#                         segment['speaker'] = speaker_segment['speaker']
#                         break

#             # Cleanup fields
#             for segment in result['segments']:
#                 for field in ['tokens', 'temperature', 'avg_logprob', 'compression_ratio', 'no_speech_prob']:
#                     segment.pop(field, None)

#             results.append(result)

#         return jsonify(results), 200

# if __name__ == "__main__":
    
#     app.run(debug=True,port=5001)
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from whisperplus import ASRDiarizationPipeline, format_speech_to_dialogue

app = Flask(__name__)
CORS(app)

# Initialize ASR Diarization Pipeline
pipeline = ASRDiarizationPipeline.from_pretrained(
    asr_model="openai/whisper-large-v3",
    diarizer_model="pyannote/speaker-diarization",
    use_auth_token="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",
    chunk_length_s=30,  # This is the default, but it's set here for clarity
    device="cpu"
)

@app.route("/process-audio/", methods=["POST"])
def process_audio():
    print("Starting audio processing...")
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        file_path = f"temp/{filename}"  # Save file to temp directory
        file.save(file_path)
        
        # Perform diarization and transcription using whisperplus
        output_text = pipeline(file_path, num_speakers=2, min_speaker=1, max_speaker=4)
        dialogue = format_speech_to_dialogue(output_text)
        return jsonify(dialogue), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)

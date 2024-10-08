from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import whisper
from werkzeug.utils import secure_filename
from pyannote.audio import Pipeline
import json
import os
from datetime import datetime
import uuid
from pydub import AudioSegment
import logging
from dotenv import load_dotenv
import oracledb

load_dotenv()
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_PORT = os.environ.get("DB_PORT")
DB_SERVICE_NAME = os.environ.get("DB_SERVICE_NAME")
DB_HOST = os.environ.get("DB_HOST")

connection = oracledb.connect(user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT, service_name=DB_SERVICE_NAME)
cursor = connection.cursor()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=os.environ.get("HF_AUTH_TOKEN"))

whisper_model = whisper.load_model("large", device="cpu")

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
        # Convert to WAV if necessary
        if filename.endswith(('.mp4', '.mp3', '.avi')):
            original = AudioSegment.from_file(file_path)
            wav_path = file_path.rsplit('.', 1)[0] + '.wav'
            original.export(wav_path, format='wav')
            file_path = wav_path

        socketio.emit('progress', {'progress': 10})

        # Load audio for transcription
        audio_data = whisper.load_audio(file_path)
        socketio.emit('progress', {'progress': 30})

        # Speaker Diarization
        diarization = pipeline(file_path)
        socketio.emit('progress', {'progress': 50})

        # Process segments with diarization data
        diarization_segments = [{
            'start': round(turn.start, 2),
            'end': round(turn.end, 2),
            'speaker': speaker
        } for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)]

        socketio.emit('progress', {'progress': 70})

        # Transcription
        transcription = whisper.transcribe(whisper_model, audio_data, language="tr")

        previous_speaker = None
        for segment in transcription['segments']:
            # Find the closest matching diarization segment
            closest_segment = min(
                diarization_segments,
                key=lambda x: min(abs(x['start'] - segment['start']), abs(x['end'] - segment['end']))
            )

            if closest_segment:
                segment['speaker'] = closest_segment['speaker']
                previous_speaker = closest_segment['speaker']
            else:
                segment['speaker'] = previous_speaker

            del segment['tokens']
            del segment['temperature']
            del segment['seek']
            del segment['avg_logprob']
            del segment['no_speech_prob']
            del segment['compression_ratio']
        socketio.emit('progress', {'progress': 90})

        # Save results and emit final progress
        transcription_file = f"{filename}_transcription.json"
        with open(f"temp/{transcription_file}", 'w') as f:
            f.write(json.dumps(transcription))
        socketio.emit('progress', {'progress': 100})

        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Get next value for TRANSCRIPT_ID from sequence
        cursor.execute("SELECT IBS.SEQ_TRANSCRIPT_ID.NEXTVAL FROM dual")
        transcript_id = cursor.fetchone()[0]

        response_data = {
            'id': transcript_id,
            'transcription': transcription,
            'created_at': created_at
        }

        # Save transcription to database
        cursor.execute(
            "INSERT INTO ze_iso_ai_transcripts (TRANSCRIPT_ID, CREATED_AT, FULL_TEXT) VALUES (:1, TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS.FF'), :3)",
            (transcript_id, created_at, transcription['text'])
        )
        connection.commit()

        # Save segments to database
        for segment in transcription['segments']:
            cursor.execute(
                "INSERT INTO ze_iso_ai_segments (SEGMENT_ID, TRANSCRIPT_ID, START_TIME, END_TIME, TRANSCRIBED_TEXT, SPEAKER) "
                "VALUES (IBS.SEQ_SEGMENT_ID.NEXTVAL, :1, :2, :3, :4, :5)",
                (transcript_id, segment['start'], segment['end'], segment['text'], segment['speaker'])
            )
        connection.commit()
        return jsonify(response_data), 200
    except Exception as e:
        logging.exception("Failed during processing")
        socketio.emit('progress', {'progress': 0})
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    socketio.run(app, debug=False, port=5001)

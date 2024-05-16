from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from pyannote.audio import Pipeline
import whisper
from pydub import AudioSegment
import os
from datetime import datetime
import json
import logging
from db import cursor, connection,LOB,ERROR
from socketio_instance import socketio
from logger import configure_logging
from pyannote.audio.pipelines.utils.hook import ProgressHook
hf_auth_token = os.getenv("HF_AUTH_TOKEN")
# Determine which logging mode to use
aggressive_mode = os.getenv("AGGRESSIVE_LOGGING", "False").lower() in ['true', '1', 't']
logger = configure_logging(logging.DEBUG if aggressive_mode else logging.INFO, aggressive=aggressive_mode)


audio_bp = Blueprint('audio_bp', __name__)

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=hf_auth_token
)
whisper_model = whisper.load_model("large", device="cpu")

def emit_progress(progress):
    socketio.emit('progress', {'progress': progress})
    
    
@audio_bp.route("/process-audio/", methods=["GET"])
def hello ():
    return "Hello World"

@audio_bp.route("/process-audio/", methods=["POST"])
def process_audio():
    logger.info("New transcription request received","aggresive")
    if 'file' not in request.files:
        logger.error("No file part in request")
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        logger.error("No file selected")
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

        emit_progress(10)

        # Load audio for transcription
        audio_data = whisper.load_audio(file_path)
        emit_progress(30)

        # Speaker Diarization
        # diarization = pipeline(file_path)
        
        
        with ProgressHook() as hook:
            diarization = pipeline(file_path, hook=hook)
            
        emit_progress(50)

        # Process segments with diarization data
        diarization_segments = [{
            'start': round(turn.start, 2),
            'end': round(turn.end, 2),
            'speaker': speaker
        } for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)]

        emit_progress(70)

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
        emit_progress(90)

        # Save results and emit final progress
        transcription_file = f"{filename}_transcription.json"
        with open(f"temp/{transcription_file}", 'w') as f:
            f.write(json.dumps(transcription))
        emit_progress(100)

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
        emit_progress(0)
        return jsonify({'error': str(e)}), 500
    


@audio_bp.route("/transcriptions/<id>", methods=["GET"])
def get_transcription(id):
    try:
        # Fetch transcription from database
        cursor.execute(
            """
            SELECT TRANSCRIPT_ID, CREATED_AT
            FROM ze_iso_ai_transcripts
            WHERE TRANSCRIPT_ID = :1
            """,
            (str(id),)
        )
        transcription = cursor.fetchone()
        if not transcription:
            return jsonify(error="No transcription found for this ID"), 404

        # Fetch segments from database
        cursor.execute(
            """
            SELECT SEGMENT_ID, START_TIME, END_TIME, SPEAKER, TRANSCRIPT_ID, TRANSCRIBED_TEXT 
            FROM ze_iso_ai_segments 
            WHERE TRANSCRIPT_ID = :1
            """,
            (str(id),)
        )
        rows = cursor.fetchall()
        if not rows:
            return jsonify(error="No transcription found for this ID"), 404
        else:
            segments = []
            for row in rows:
                segment = {}
                for column, value in zip([column[0] for column in cursor.description], row):
                    if isinstance(value, LOB):
                        value = value.read()  
                    segment[column] = value
                segments.append(segment)

            return jsonify({
                'transcription_id': transcription[0],
                'created_at': transcription[1],
                'segments': segments
            })
    except ERROR as e:  
        return jsonify(error=str(e)), 500
    
@audio_bp.route("/rename_segments/<transcription_id>/<old_name>/<new_name>", methods=["POST"])
def renameSegments(transcription_id, old_name, new_name):
    cursor.execute("""
                   UPDATE ze_iso_ai_segments 
                   SET SPEAKER = :1 
                   WHERE SPEAKER = :2 AND TRANSCRIPT_ID = :3
                   """, (new_name, old_name, transcription_id))
    connection.commit()
    return {"status": "success"}, 200
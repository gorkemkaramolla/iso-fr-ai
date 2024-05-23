from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from pyannote.audio import Pipeline
import whisper
from pydub import AudioSegment
import os
from datetime import datetime
import json
import logging
from db import cursor, connection, LOB, ERROR
from socketio_instance import socketio
from logger import configure_logging
from pyannote.audio.pipelines.utils.hook import ProgressHook
import torch
hf_auth_token = os.getenv("HF_AUTH_TOKEN")
# Determine which logging mode to use
aggressive_mode = os.getenv("AGGRESSIVE_LOGGING", "False").lower() in ['true', '1', 't']
logger = configure_logging(logging.DEBUG if aggressive_mode else logging.INFO, aggressive=aggressive_mode)

audio_bp = Blueprint('audio_bp', __name__)
def save_transcription_and_segments(transcription, diarization_segments, filename):
    # Save results to a JSON file
    transcription_file = f"{filename}_transcription.json"
    with open(f"temp/{transcription_file}", 'w') as f:
        f.write(json.dumps(transcription))
    
    created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Get next value for TRANSCRIPT_ID from sequence
    cursor.execute("SELECT IBS.SEQ_TRANSCRIPT_ID.NEXTVAL FROM dual")
    transcript_id = cursor.fetchone()[0]

    # Save transcription to database
    cursor.execute(
        "INSERT INTO ze_iso_ai_transcripts (TRANSCRIPT_ID, CREATED_AT, FULL_TEXT) VALUES (:1, TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS.FF'), :3)",
        (transcript_id, created_at, transcription['text'])
    )
    connection.commit()

    # Save segments to database
    for segment in diarization_segments:
        cursor.execute(
            "INSERT INTO ze_iso_ai_segments (SEGMENT_ID, TRANSCRIPT_ID, START_TIME, END_TIME, TRANSCRIBED_TEXT, SPEAKER) "
            "VALUES (IBS.SEQ_SEGMENT_ID.NEXTVAL, :1, :2, :3, :4, :5)",
            (transcript_id, segment['start'], segment['end'], segment['text'], segment['speaker'])
        )
    connection.commit()

def prepare_response_data(filename):
    # Fetch the most recent transcript ID for the given filename
    cursor.execute(
        """
        SELECT TRANSCRIPT_ID, CREATED_AT, FULL_TEXT
        FROM ze_iso_ai_transcripts
        WHERE TRANSCRIPT_ID = (
            SELECT MAX(TRANSCRIPT_ID)
            FROM ze_iso_ai_transcripts
            WHERE FULL_TEXT LIKE :1
        )
        """,
        (f"%{filename}%",)
    )
    transcription_record = cursor.fetchone()
    
    if not transcription_record:
        return {'error': 'No transcription found'}

    transcript_id, created_at, full_text = transcription_record

    # Fetch segments
    cursor.execute(
        """
        SELECT SEGMENT_ID, START_TIME, END_TIME, TRANSCRIBED_TEXT, SPEAKER
        FROM ze_iso_ai_segments
        WHERE TRANSCRIPT_ID = :1
        """,
        (transcript_id,)
    )
    rows = cursor.fetchall()
    segments = []
    for row in rows:
        segments.append({
            'segment_id': row[0],
            'start_time': row[1],
            'end_time': row[2],
            'transcribed_text': row[3],
            'speaker': row[4]
        })
    
    return {
        'transcription_id': transcript_id,
        'created_at': created_at,
        'full_text': full_text,
        'segments': segments
    }


def emit_progress(progress):
    socketio.emit('progress', {'progress': progress})

def handle_transcription(file_path, audio_data):
    torch.cuda.empty_cache()  # Clear GPU cache before loading the model
    whisper_model = whisper.load_model("large", device="cuda")  # Load model
    try:
        # Transcribe the audio
        transcription = whisper.transcribe(whisper_model, audio_data, language="tr")
        return transcription
    finally:
        del whisper_model  # Delete the model
        torch.cuda.empty_cache()  # Clear GPU cache after processing

def handle_diarization(file_path):
    torch.cuda.empty_cache()  # Clear GPU cache before loading the model
    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token=hf_auth_token)
    pipeline.to(torch.device("cuda"))
    try:
        with ProgressHook() as hook:
            diarization = pipeline(file_path, hook=hook)
        return diarization
    finally:
        del pipeline  # Delete the pipeline
        torch.cuda.empty_cache()  # Clear GPU cache after processing

@audio_bp.route("/process-audio/", methods=["GET"])
def hello():
    return "Hello World"

@audio_bp.route("/process-audio/", methods=["POST"])
def process_audio():
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
        if filename.endswith(('.mp4', '.mp3', '.avi')):
            original = AudioSegment.from_file(file_path)
            wav_path = file_path.rsplit('.', 1)[0] + '.wav'
            original.export(wav_path, format='wav')
            file_path = wav_path

        emit_progress(10)
        audio_data = whisper.load_audio(file_path)
        emit_progress(30)
        diarization = handle_diarization(file_path)
        emit_progress(50)
        diarization_segments = [{
            'start': round(turn.start, 2),
            'end': round(turn.end, 2),
            'speaker': speaker
        } for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)]

        emit_progress(70)
        transcription = handle_transcription(file_path, audio_data)
        emit_progress(90)

        # Process and save transcription and segments
        save_transcription_and_segments(transcription, diarization_segments, filename)
        emit_progress(100)

        response_data = prepare_response_data(filename)
        return jsonify(response_data), 200

    except Exception as e:
        logger.exception("Failed during processing")
        emit_progress(0)
        return jsonify({'error': str(e)}), 500




@audio_bp.route("/transcriptions/<id>", methods=["GET"])
def get_transcription(id):
    try:
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
def rename_segments(transcription_id, old_name, new_name):
    cursor.execute(
        """
        UPDATE ze_iso_ai_segments 
        SET SPEAKER = :1 
        WHERE SPEAKER = :2 AND TRANSCRIPT_ID = :3
        """, 
        (new_name, old_name, transcription_id)
    )
    connection.commit()
    return {"status": "success"}, 200

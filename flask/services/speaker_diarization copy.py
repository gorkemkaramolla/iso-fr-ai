# speaker_diarization.py
from flask import jsonify, Blueprint, request
from werkzeug.utils import secure_filename
from pyannote.audio import Pipeline
import whisper
from pydub import AudioSegment
import torch
import os
from datetime import datetime
import json
import logging
from db import cursor, connection, LOB, ERROR
from socketio_instance import socketio
from logger import configure_logging
from pyannote.audio.pipelines.utils.hook import ProgressHook
import oracledb

class SpeakerDiarizationProcessor:
    @staticmethod
    def sanitize_string(input_string):
        """Sanitize strings by stripping leading/trailing whitespace and escaping special characters."""
        if isinstance(input_string, str):
            # Strip leading/trailing whitespace
            cleaned_string = input_string.strip()
            # Replace single quotes with two single quotes for SQL escaping
            cleaned_string = cleaned_string.replace("'", "''")
            return cleaned_string
        return input_string

    @staticmethod
    def to_float(input_value):
        """Convert values to float, handle conversion errors."""
        try:
            return float(input_value)
        except ValueError:
            return None  # Or handle the error as needed

    def __init__(self,processor):
        self.processor = processor
        self.hf_auth_token = os.getenv("HF_AUTH_TOKEN")
        self.logger = configure_logging()
        self.audio_bp = Blueprint('audio_bp', __name__)
        self.pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=self.hf_auth_token
        )
        self.pipeline.to(torch.device(self.processor))
        self.whisper_model = None

    def emit_progress(self, progress):
        socketio.emit('progress', {'progress': progress})

    def rename_segments(self, transcription_id, old_name, new_name):
        cursor.execute("""
                    UPDATE ze_iso_ai_segments 
                    SET SPEAKER = :new_name 
                    WHERE SPEAKER = :old_name AND TRANSCRIPT_ID = :transcription_id
                    """,
                    {
                        "new_name": new_name, 
                        "old_name": old_name, 
                        "transcription_id": transcription_id
                    })
        connection.commit()
        return {"status": "success"}, 200

    def get_transcription(self, id):
        try:
            # Fetching the transcription details
            cursor.execute(
                """
                SELECT TRANSCRIPT_ID, CREATED_AT
                FROM ze_iso_ai_transcripts
                WHERE TRANSCRIPT_ID = :transcript_id
                """,
                {"transcript_id": id}
            )
            transcription = cursor.fetchone()
            if not transcription:
                return jsonify(error="No transcription found for this ID"), 404

            # Fetching the segments associated with the transcription
            cursor.execute(
                """
                SELECT SEGMENT_ID, START_TIME, END_TIME, SPEAKER, TRANSCRIPT_ID, TRANSCRIBED_TEXT 
                FROM ze_iso_ai_segments 
                WHERE TRANSCRIPT_ID = :transcript_id
                """,
                {"transcript_id": int(transcription[0])}  # Use the fetched TRANSCRIPT_ID for clarity
            )
            rows = cursor.fetchall()
            if not rows:
                return jsonify(error="No segments found for this transcription"), 404

            # Process segments
            segments = [
                {column.name: (value.read() if isinstance(value, oracledb.LOB) else value)
                for column, value in zip(cursor.description, row)}
                for row in rows
            ]

            # Return the full transcription with segments
            return jsonify({
                'transcription_id': transcription[0],
                'created_at': transcription[1],
                'segments': segments
            }), 200

        except oracledb.Error as e:
            # Log detailed error information
            self.logger.error(f"Database error: {str(e)}")
            return jsonify(error="Internal server error"), 500






    def process_audio(self):
        self.logger.info("New transcription request received")
        if 'file' not in request.files:
            self.logger.error("No file part in request")
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            self.logger.error("No file selected")
            return jsonify({'error': 'No selected file'}), 400
        
        filename = secure_filename(file.filename)
        file_path = os.path.join("temp", filename)
        file.save(file_path)

        try:
            if filename.endswith(('.mp4', '.mp3', '.avi')):
                original = AudioSegment.from_file(file_path)
                wav_path = f"{os.path.splitext(file_path)[0]}.wav"
                original.export(wav_path, format='wav')
                file_path = wav_path

            self.emit_progress(10)
            if not self.whisper_model:
                torch.cuda.empty_cache()
                self.whisper_model = whisper.load_model("large", device=self.processor)

            audio_data = whisper.load_audio(file_path)
            self.emit_progress(30)

            with ProgressHook() as hook:
                diarization = self.pipeline(file_path, hook=hook)
            self.emit_progress(50)

            diarization_segments = [
                {'start': round(turn.start, 2), 'end': round(turn.end, 2), 'speaker': speaker}
                for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)
            ]

            self.emit_progress(70)
            transcription = whisper.transcribe(self.whisper_model, audio_data, language="tr")

            for segment in transcription['segments']:
                closest_segment = min(
                    diarization_segments,
                    key=lambda x: min(abs(x['start'] - segment['start']), abs(x['end'] - segment['end']))
                )
                segment['speaker'] = closest_segment['speaker'] if closest_segment else None

            self.emit_progress(90)
            transcription_file = f"{filename}_transcription.json"
            with open(os.path.join("temp", transcription_file), 'w') as f:
                f.write(json.dumps(transcription))
            self.emit_progress(100)

            created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute("SELECT IBS.SEQ_TRANSCRIPT_ID.NEXTVAL FROM dual")
            transcript_id = cursor.fetchone()[0]

            response_data = {
                'id': transcript_id,
                'transcription': transcription,
                'created_at': created_at
            }
            cursor.execute(
                "INSERT INTO ze_iso_ai_transcripts (TRANSCRIPT_ID, CREATED_AT, FULL_TEXT) VALUES (:transcript_id, TO_TIMESTAMP(:created_at, 'YYYY-MM-DD HH24:MI:SS.FF'), :full_text)",
                {"transcript_id": transcript_id, "created_at": created_at, "full_text": transcription['text']}
            )
            connection.commit()
            
            for segment in transcription['segments']:
                sanitized_transcribed_text = self.sanitize_string(segment['text'])
                sanitized_speaker = self.sanitize_string(segment['speaker'])
                start_time_float = self.to_float(segment['start'])
                end_time_float = self.to_float(segment['end'])
                cursor.execute(
                        """
                        INSERT INTO ze_iso_ai_segments (
                            SEGMENT_ID, TRANSCRIPT_ID, START_TIME, END_TIME, TRANSCRIBED_TEXT, SPEAKER
                        ) VALUES (
                            IBS.SEQ_SEGMENT_ID.NEXTVAL, :transcript_id, :start_time, :end_time, :transcribed_text, :speaker
                        )
                        """,
                        {
                            "transcript_id": transcript_id,
                            "start_time": start_time_float,
                            "end_time": end_time_float,
                            "transcribed_text": sanitized_transcribed_text,
                            "speaker": sanitized_speaker
                        }
                    )
            connection.commit()

            return jsonify(response_data), 200
        except Exception as e:
            self.logger.exception("Failed during processing")
            self.emit_progress(0)
            return jsonify({'error': str(e)}), 500

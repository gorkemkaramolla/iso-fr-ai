from flask import jsonify, Blueprint, request
from werkzeug.utils import secure_filename

# import whisper
import torch
from whisper_run import AudioProcessor
import os
from datetime import datetime
import json
from bson import ObjectId
import logging

# from db import cursor, connection, LOB, ERROR
from db import mongo_client, mongo_db
from socketio_instance import socketio
from logger import configure_logging


# import oracledb
class SpeakerDiarizationProcessor:
    def __init__(self, device):
        self.mongo_client = mongo_client
        self.mongo_db = mongo_db
        self.device = device
        self.hf_auth_token = os.getenv("HF_AUTH_TOKEN")
        self.logger = configure_logging()
        self.audio_bp = Blueprint("audio_bp", __name__)

    def emit_progress(self, progress):
        socketio.emit("progress", {"progress": progress})

    def rename_segments(self, transcription_id, old_name, new_name):
        collection = self.mongo_db["segments"]
        update_result = collection.update_many(
            {"speaker": old_name, "transcript_id": transcription_id},
            {"$set": {"speaker": new_name}},
        )

        if update_result.modified_count > 0:
            return {"status": "success"}, 200
        else:
            return {"status": "no changes made"}, 200

    def get_all_transcriptions(self):
        try:
            collection = self.mongo_db["transcripts"]

            cursor = collection.find({})

            all_transcriptions = [
                {
                    "transcription_id": str(doc["_id"]),
                    "created_at": doc["created_at"],
                    "full_text": doc.get(
                        "full_text", ""
                    ),  # Optionally include full text if you want to show it
                }
                for doc in cursor
            ]
            self.logger.info(
                f"Transcriptions: {all_transcriptions} successfully fetched from database"
            )
            return jsonify(all_transcriptions), 200
        except Exception as e:
            self.logger.info(f"Database error: {str(e)}")
            return jsonify(error=str(e)), 500

    def safe_parse_date(self, date_value):
        if not date_value:
            return None
        if isinstance(date_value, str):
            return date_value  # If it's already a string, return it directly
        try:
            return date_value.isoformat() if date_value else None
        except ValueError as e:
            self.logger.error(
                f"Invalid date encountered: {e}, Date Value: {date_value}"
            )
            return None
        except AttributeError as e:
            self.logger.error(f"Attribute error: {e}, Date Value: {date_value}")
            return None

    def get_transcription(self, id):
        try:
            # Access the collection
            transcripts_collection = self.mongo_db["transcripts"]
            segments_collection = self.mongo_db["segments"]

            # Fetch the transcription document
            transcription = transcripts_collection.find_one({"_id": id})
            if not transcription:
                self.logger.error(f"No transcription found for ID: {id}")
                return jsonify(error="No transcription found for this ID"), 404

            # Fetch related segments
            segments = list(segments_collection.find({"transcript_id": id}))

            if not segments:
                self.logger.error(f"No transcription segments found for ID: {id}")
                return jsonify(error="No transcription segments found for this ID"), 404

            # Construct response data
            segments_data = [
                {
                    "segment_id": str(segment["_id"]),
                    "start_time": segment["start_time"],
                    "end_time": segment["end_time"],
                    "speaker": segment["speaker"],
                    "transcribed_text": segment["transcribed_text"],
                }
                for segment in segments
            ]

            result = {
                "transcription_id": str(transcription["_id"]),
                "created_at": transcription["created_at"],
                "full_text": transcription.get("full_text", ""),
                "segments": segments_data,
            }
            self.logger.info(
                f"get_transcription: {result} successfully fetched from database"
            )
            return jsonify(result), 200
        except Exception as e:
            error_message = f"Error during transcription retrieval: {e}"
            self.logger.error(error_message)
            return (
                jsonify(error="An error occurred while retrieving the transcription."),
                500,
            )

    def process_audio(self, client_id):
        self.logger.info("New transcription request received")
        if "file" not in request.files:
            self.logger.error("No file part in request")
            return jsonify({"error": "No file part"}), 400

        file = request.files["file"]
        if file.filename == "":
            self.logger.error("No file selected")
            return jsonify({"error": "No selected file"}), 400

        filename = secure_filename(file.filename)
        self.file_path = os.path.join("temp", filename)
        file.save(self.file_path)

        try:
            if filename.endswith((".mp4", ".mp3", ".avi")):
                original = AudioSegment.from_file(file_path)
                wav_path = f"{os.path.splitext(file_path)[0]}.wav"
                original.export(wav_path, format="wav")
                self.file_path = wav_path

            self.emit_progress(100)
            self.emit_progress(10)
            self.emit_progress(30)
            self.emit_progress(50)

            processor = AudioProcessor(
                self.file_path, self.device, self.hf_auth_token, "large-v3"
            )
            transcription = processor.process()
            self.emit_progress(70)
            self.emit_progress(90)

            created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            transcript_id = str(ObjectId())

            response_data = {
                "id": transcript_id,
                "transcription": transcription,
                "created_at": created_at,
            }

            self.mongo_db.transcripts.insert_one(
                {
                    "_id": transcript_id,
                    "created_at": created_at,
                    "full_text": transcription["text"],
                }
            )

            for segment in transcription["segments"]:
                self.mongo_db.segments.insert_one(
                    {
                        "transcript_id": transcript_id,
                        "start_time": segment["start"],
                        "end_time": segment["end"],
                        "transcribed_text": segment["text"],
                        "speaker": segment["speaker"],
                    }
                )

            return jsonify(response_data), 200
        except Exception as e:
            self.logger.exception("Failed during processing")
            self.emit_progress(0)
            return jsonify({"error": str(e)}), 500

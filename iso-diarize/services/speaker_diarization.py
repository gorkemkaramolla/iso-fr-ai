import logging
from db import mongo_client, mongo_db
from socketio_instance import socketio
from logger import configure_logging
from flask import Blueprint, request
from werkzeug.utils import secure_filename
from pydub import AudioSegment
import os
from whisper_run import AudioProcessor
import requests
from datetime import datetime,timezone


from bson import ObjectId
os.environ["CURL_CA_BUNDLE"] = ""
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

    def rename_segments(self, transcription_id, old_names, new_name):
        collection = self.mongo_db["segments"]
        update_result = collection.update_many(
            {"speaker": {"$in": old_names}, "transcript_id": transcription_id},
            {"$set": {"speaker": new_name}},
        )

        if update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def rename_selected_segments(self, transcription_id, old_names, new_name, segment_ids):
        collection = self.mongo_db["segments"]
        update_result = collection.update_many(
            {"_id": {"$in": [ObjectId(segment_id) for segment_id in segment_ids]},
             "speaker": {"$in": old_names},
             "transcript_id": transcription_id},
            {"$set": {"speaker": new_name}},
        )

        if update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def rename_transcribed_text(self, transcription_id, old_texts, new_text):
        segments_collection = self.mongo_db["segments"]
        transcripts_collection = self.mongo_db["transcripts"]

        segments_update_result = segments_collection.update_many(
            {"transcribed_text": {"$in": old_texts}, "transcript_id": transcription_id},
            {"$set": {"transcribed_text": new_text}},
        )

        transcripts_update_result = transcripts_collection.update_many(
            {"transcription_id": transcription_id, "full_text": {"$regex": "|".join(old_texts)}},
            {"$set": {"full_text": self.replace_text_in_full_text(transcripts_collection, transcription_id, old_texts, new_text)}},
        )

        if segments_update_result.modified_count > 0 or transcripts_update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def rename_selected_texts(self, transcription_id, old_texts, new_text, segment_ids):
        segments_collection = self.mongo_db["segments"]

        segments_update_result = segments_collection.update_many(
            {"_id": {"$in": [ObjectId(segment_id) for segment_id in segment_ids]},
             "transcribed_text": {"$in": old_texts},
             "transcript_id": transcription_id},
            {"$set": {"transcribed_text": new_text}},
        )

        if segments_update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def replace_text_in_full_text(self, transcripts_collection, transcription_id, old_texts, new_text):
        transcript = transcripts_collection.find_one({"transcription_id": transcription_id})
        if transcript:
            full_text = transcript.get("full_text", "")
            for old_text in old_texts:
                full_text = full_text.replace(old_text, new_text)
            return full_text
        return ""

    def delete_transcription(self, transcription_id):
        collection = self.mongo_db["transcripts"]

        # Perform the delete operation using the _id field as a string
        delete_result = collection.delete_one({"_id": transcription_id})

        if delete_result.deleted_count > 0:
            return {"status": "success", "deleted_count": delete_result.deleted_count}
        else:
            return {"status": "no changes made"}

        
        
    def delete_segments(self, transcription_id, segment_ids):
        collection = self.mongo_db["segments"]
        delete_result = collection.delete_many(
            {"_id": {"$in": [ObjectId(segment_id) for segment_id in segment_ids]},
             "transcript_id": transcription_id}
        )

        if delete_result.deleted_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def get_all_transcriptions(self):
        try:
            collection = self.mongo_db["transcripts"]
            cursor = collection.find({})
            all_transcriptions = [
                {
                    "name": doc["name"],
                    "transcription_id": str(doc["_id"]),  # Convert ObjectId to string here
                    "created_at": doc["created_at"],
                    "full_text": doc.get("full_text", ""),
                }
                for doc in cursor
            ]
            return all_transcriptions
        except Exception as e:
            self.logger.info(f"Database error: {str(e)}")
            return {"error": str(e)}

    def get_transcription(self, id):
        try:
            transcripts_collection = self.mongo_db["transcripts"]
            segments_collection = self.mongo_db["segments"]
            transcription = transcripts_collection.find_one({"_id": id})
            if not transcription:
                self.logger.error(f"No transcription found for ID: {id}")
                return {"error": "No transcription found for this ID"}

            segments = list(segments_collection.find({"transcript_id": id}))
            if not segments:
                self.logger.error(f"No transcription segments found for ID: {id}")
                return {"error": "No transcription segments found for this ID"}

            segments_data = [
                {
                    "segment_id": str(segment["_id"]),  # Convert ObjectId to string here
                    "start_time": segment["start_time"],
                    "end_time": segment["end_time"],
                    "speaker": segment["speaker"],
                    "transcribed_text": segment["transcribed_text"],
                }
                for segment in segments
            ]

            result = {
                "name": str(transcription["name"]),
                "transcription_id": str(transcription["_id"]),  # Convert ObjectId to string here
                "created_at": transcription["created_at"],
                "full_text": transcription.get("full_text", ""),
                "segments": segments_data,
            }
            return result
        except Exception as e:
            error_message = f"Error during transcription retrieval: {e}"
            self.logger.error(error_message, exc_info=True)
            return {"error": "An error occurred while retrieving the transcription"}

    def process_audio(self):
        if "file" not in request.files:
            self.logger.error("No file part in request")
            return {"error": "No file part"}

        file = request.files["file"]
        if file.filename == "":
            self.logger.error("No file selected")
            return {"error": "No selected file"}

        try:
            # Generate transcript ID before saving the file
            transcript_id = str(ObjectId())
            wav_filename = f"{transcript_id}.wav"
            wav_file_path = os.path.join("temp", wav_filename)
            
            # Save the original file temporarily for conversion
            original_file_path = os.path.join("temp", secure_filename(file.filename))
            file.save(original_file_path)

            # Convert the file to WAV format if necessary
            if original_file_path.endswith((".mp4", ".mp3", ".avi")):
                original = AudioSegment.from_file(original_file_path)
                original.export(wav_file_path, format="wav")
                os.remove(original_file_path)  # Remove the original file after conversion
            else:
                # If the file is already in WAV format, just rename it
                os.rename(original_file_path, wav_file_path)

            self.file_path = wav_file_path

            self.emit_progress(100)
            self.emit_progress(10)
            self.emit_progress(30)
            self.emit_progress(50)
            
            model_dir = os.path.join(os.path.dirname(__file__), "large-v3/")
            processor = AudioProcessor(self.file_path, self.device, model_name=model_dir)
            transcription = processor.process()
            self.emit_progress(70)
            self.emit_progress(90)

            created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

            response_data = {
                "id": transcript_id,
                "name": wav_filename,
                "transcription": transcription,
                "created_at": created_at,
            }

            self.mongo_db.transcripts.insert_one(
                {
                    "_id": transcript_id,
                    "name": wav_filename,
                    "created_at": created_at,
                    "full_text": transcription["text"],
                }
            )

            try:
                # response = requests.post('http://utils_service:5004/add_to_solr', json=response_data)
                # response.raise_for_status()
                print("Successfully added data to Solr")
            except requests.exceptions.RequestException as e:
                print(f"Failed to add data to Solr: {e}")

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

            return response_data
        except Exception as e:
            self.logger.exception("Failed during processing")
            self.emit_progress(0)
            return {"error": str(e)}

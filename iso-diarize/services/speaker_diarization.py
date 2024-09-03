# import logging
# import os
# from flask import Blueprint, request
# from werkzeug.utils import secure_filename
# from pydub import AudioSegment
# from pymongo import MongoClient
# from bson import ObjectId
# from socketio_instance import socketio
# from logger import configure_logging
# from whisper_run import AudioProcessor
# from datetime import datetime, timezone
# import requests
# from config import XMLConfig

# os.environ["CURL_CA_BUNDLE"] = ""


# class SpeakerDiarizationProcessor:
#     def __init__(self, device):
#         # Initialize configuration from config.xml
#         config = XMLConfig(service_name="speaker_diarization_service")
#         xml_mongo_config = XMLConfig(service_name="mongo")
#         # Setup MongoDB connection using the configuration
#         self.mongo_client = MongoClient(xml_mongo_config.MONGO_DB_URI)
#         self.mongo_db = self.mongo_client[xml_mongo_config.MONGO_DB_NAME]

#         self.device = device
#         self.hf_auth_token = os.getenv("HF_AUTH_TOKEN")
#         self.logger = configure_logging()
#         self.audio_bp = Blueprint("audio_bp", __name__)

#     def emit_progress(self, progress):
#         socketio.emit("progress", {"progress": progress})

#     def rename_segments(self, transcription_id, old_names, new_name):
#         collection = self.mongo_db["transcripts"]
#         update_result = collection.update_many(
#             {"_id": ObjectId(transcription_id), "segments.speaker": {"$in": old_names}},
#             {
#                 "$set": {"segments.$[].speaker": new_name}
#             },  # Use $[] to update all matching elements in the array
#         )

#         if update_result.modified_count > 0:
#             return {"status": "success"}
#         else:
#             return {"status": "no changes made"}

#     def rename_selected_segments(
#         self, transcription_id, old_names, new_name, segment_ids
#     ):
#         collection = self.mongo_db["transcripts"]

#         # Convert segment_ids to integers
#         segment_ids = [int(segment_id) for segment_id in segment_ids]

#         # Use integer segment IDs directly
#         update_result = collection.update_many(
#             {
#                 "_id": ObjectId(transcription_id),
#                 "segments.id": {"$in": segment_ids},  # Match segments by integer ID
#                 "segments.speaker": {"$in": old_names},  # Match the old speaker names
#             },
#             {"$set": {"segments.$[elem].speaker": new_name}},  # Update the speaker name
#             array_filters=[
#                 {"elem.id": {"$in": segment_ids}, "elem.speaker": {"$in": old_names}}
#             ],  # Apply update to all matching segments
#         )

#         if update_result.modified_count > 0:
#             return {"status": "success"}
#         else:
#             return {"status": "no changes made"}

#     def rename_transcribed_text(self, transcription_id, changes):
#         collection = self.mongo_db["transcripts"]
#         updates = 0

#         for change in changes:
#             segment_id = int(change["segmentId"])
#             current_text = change["currentText"]

#             # Update the specific segment's text field based on the segment ID
#             update_result = collection.update_one(
#                 {"_id": ObjectId(transcription_id), "segments.id": segment_id},
#                 {"$set": {"segments.$.text": current_text}},
#             )

#             # Check if the segment was updated successfully
#             self.logger.info(
#                 f"Update result: Matched {update_result.matched_count}, Modified {update_result.modified_count} for Segment ID {segment_id}"
#             )

#             updates += update_result.modified_count

#         # Log the total number of segments updated
#         self.logger.info(f"Total segments updated: {updates}")

#         # Return the appropriate response based on the updates made
#         if updates > 0:
#             return {"status": "success"}
#         else:
#             return {"status": "no changes made"}

#     def rename_selected_texts(self, transcription_id, old_texts, new_text, segment_ids):
#         collection = self.mongo_db["transcripts"]

#         # Find and update the specified segments based on their integer IDs
#         update_result = collection.update_many(
#             {
#                 "_id": ObjectId(transcription_id),
#                 "segments.id": {"$in": segment_ids},  # Match segments by integer ID
#                 "segments.text": {"$in": old_texts},  # Ensure the text matches as well
#             },
#             {
#                 "$set": {
#                     "segments.$[elem].text": new_text,
#                     "text": self.replace_text_in_full_text(
#                         collection, transcription_id, old_texts, new_text
#                     ),
#                 }
#             },
#             array_filters=[
#                 {"elem.id": {"$in": segment_ids}}
#             ],  # Apply update to matching segments
#         )

#         if update_result.modified_count > 0:
#             return {"status": "success"}
#         else:
#             return {"status": "no changes made"}

#     def replace_text_in_full_text(
#         self, transcripts_collection, transcription_id, old_texts, new_text
#     ):
#         transcript = transcripts_collection.find_one(
#             {"_id": ObjectId(transcription_id)}
#         )
#         if transcript:
#             full_text = transcript.get("full_text", "")
#             for old_text in old_texts:
#                 full_text = full_text.replace(old_text, new_text)
#             return full_text
#         return ""

#     def delete_transcription(self, transcription_id):
#         collection = self.mongo_db["transcripts"]

#         delete_result = collection.delete_one({"_id": ObjectId(transcription_id)})

#         if delete_result.deleted_count > 0:
#             return {"status": "success", "deleted_count": delete_result.deleted_count}
#         else:
#             return {"status": "no changes made"}

#     def delete_segments(self, transcription_id, segment_ids):
#         collection = self.mongo_db["transcripts"]

#         # Convert string segment IDs to ObjectIds
#         object_ids = [ObjectId(segment_id) for segment_id in segment_ids]

#         # Pull specific segments from the array
#         update_result = collection.update_one(
#             {"_id": ObjectId(transcription_id)},
#             {"$pull": {"segments": {"_id": {"$in": object_ids}}}},
#         )

#         if update_result.modified_count > 0:
#             return {"status": "success"}
#         else:
#             return {"status": "no changes made"}

#     def get_all_transcriptions(self):
#         try:
#             collection = self.mongo_db["transcripts"]
#             cursor = collection.find({})

#             all_transcriptions = []
#             for doc in cursor:
#                 # Convert ObjectId to string for the transcription ID
#                 doc["_id"] = str(doc["_id"])

#                 # Convert ObjectId to string for each segment if any
#                 if "segments" in doc:
#                     for segment in doc["segments"]:
#                         if isinstance(segment.get("_id"), ObjectId):
#                             segment["_id"] = str(segment["_id"])

#                 all_transcriptions.append(doc)

#             return all_transcriptions
#         except Exception as e:
#             self.logger.info(f"Database error: {str(e)}")
#             return {"error": str(e)}

#     def get_transcription(self, id):
#         try:
#             transcripts_collection = self.mongo_db["transcripts"]

#             # Convert the string ID to ObjectId
#             object_id = ObjectId(id)

#             # Find the transcription by ObjectId
#             transcription = transcripts_collection.find_one({"_id": object_id})
#             if not transcription:
#                 self.logger.error(f"No transcription found for ID: {id}")
#                 return {"error": "No transcription found for this ID"}

#             # Convert ObjectId to string for the transcription ID
#             transcription["_id"] = str(transcription["_id"])

#             # Convert ObjectId to string for each segment if any
#             if "segments" in transcription:
#                 for segment in transcription["segments"]:
#                     if isinstance(segment.get("_id"), ObjectId):
#                         segment["_id"] = str(segment["_id"])

#             return transcription
#         except Exception as e:
#             error_message = f"Error during transcription retrieval: {e}"
#             self.logger.error(error_message, exc_info=True)
#             return {"error": "An error occurred while retrieving the transcription"}

#     def process_audio(self):
#         self.emit_progress(10)
#         if "file" not in request.files:
#             self.logger.error("No file part in request")
#             return {"error": "No file part"}

#         file = request.files["file"]
#         if file.filename == "":
#             self.logger.error("No file selected")
#             return {"error": "No selected file"}

#         try:
#             # Generate transcript ID before saving the file
#             transcript_id = str(ObjectId())
#             wav_filename = f"{transcript_id}.wav"
#             wav_file_path = os.path.join("temp", wav_filename)

#             # Save the original file temporarily for conversion
#             original_file_path = os.path.join("temp", secure_filename(file.filename))
#             file.save(original_file_path)

#             # Convert the file to WAV format if necessary
#             if original_file_path.endswith((".mp4", ".mp3", ".avi")):
#                 original = AudioSegment.from_file(original_file_path)
#                 original.export(wav_file_path, format="wav")
#                 os.remove(
#                     original_file_path
#                 )  # Remove the original file after conversion
#             else:
#                 # If the file is already in WAV format, just rename it
#                 os.rename(original_file_path, wav_file_path)

#             self.file_path = wav_file_path

#             self.emit_progress(30)

#             model_dir = os.path.abspath(
#                 os.path.join(os.path.dirname(__file__), "large-v3")
#             )
#             processor = AudioProcessor(
#                 self.file_path, self.device, model_name=model_dir
#             )
#             transcription = processor.process()
#             print(transcription)
#             self.emit_progress(50)

#             created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
#             self.emit_progress(70)

#             response_data = {
#                 "id": transcript_id,
#                 "name": wav_filename,
#                 "transcription": transcription,
#                 "created_at": created_at,
#             }

#             # Insert the transcription with segments into the transcripts collection
#             self.mongo_db.transcripts.insert_one(
#                 {
#                     "_id": ObjectId(transcript_id),
#                     "name": wav_filename,
#                     "created_at": created_at,
#                     "text": transcription["text"],  # Keep the text field intact
#                     "segments": transcription[
#                         "segments"
#                     ],  # Keep segments as returned by processor
#                 }
#             )
#             self.emit_progress(100)
#             return response_data
#         except Exception as e:
#             self.logger.exception("Failed during processing")
#             self.emit_progress(0)
#             return {"error": str(e)}

#     def rename_transcription(self, transcription_id, new_name):
#         try:
#             # Access the transcripts collection from the MongoDB database
#             collection = self.mongo_db["transcripts"]

#             # Find the transcription by its ID
#             transcription = collection.find_one({"_id": ObjectId(transcription_id)})

#             if not transcription:
#                 # If the transcription is not found, return an error message
#                 self.logger.error(f"Transcription not found for ID: {transcription_id}")
#                 return {"error": "Transcription not found"}

#             # Update the transcription name
#             update_result = collection.update_one(
#                 {"_id": ObjectId(transcription_id)}, {"$set": {"name": new_name}}
#             )

#             if update_result.modified_count > 0:
#                 # If the update was successful, return a success message
#                 self.logger.info(
#                     f"Transcription ID {transcription_id} renamed to {new_name}"
#                 )
#                 return {"message": "Transcription renamed successfully"}
#             else:
#                 # If no changes were made, return a relevant message
#                 self.logger.info(
#                     f"No changes made for transcription ID {transcription_id}"
#                 )
#                 return {"status": "no changes made"}

#         except Exception as e:
#             # If an exception occurs, log the error and return an error message
#             self.logger.error(
#                 f"Error during renaming transcription: {str(e)}", exc_info=True
#             )
#             return {
#                 "error": f"An error occurred while renaming the transcription: {str(e)}"
#             }
import logging
import os
from flask import Blueprint, request
from werkzeug.utils import secure_filename
from pydub import AudioSegment
from pymongo import MongoClient
from bson import ObjectId
from socketio_instance import socketio
from logger import configure_logging
from whisper_run import AudioProcessor
from datetime import datetime, timezone
from config import XMLConfig
from threading import Lock

os.environ["CURL_CA_BUNDLE"] = ""


class SpeakerDiarizationProcessor:
    def __init__(self, device):
        # Initialize configuration from config.xml
        config = XMLConfig(service_name="speaker_diarization_service")
        xml_mongo_config = XMLConfig(service_name="mongo")
        # Setup MongoDB connection using the configuration
        self.mongo_client = MongoClient(xml_mongo_config.MONGO_DB_URI)
        self.mongo_db = self.mongo_client[xml_mongo_config.MONGO_DB_NAME]

        self.device = device
        self.hf_auth_token = os.getenv("HF_AUTH_TOKEN")
        self.logger = configure_logging()
        self.audio_bp = Blueprint("audio_bp", __name__)

        # In-memory progress tracking
        self.progress_tracker = {}
        self.lock = Lock()

    def emit_progress(self, transcript_id, progress):
        with self.lock:
            self.progress_tracker[transcript_id] = progress
        socketio.emit(
            "progress", {"transcript_id": transcript_id, "progress": progress}
        )

    def get_progress(self, transcript_id):
        with self.lock:
            return self.progress_tracker.get(transcript_id, 0)

    def rename_segments(self, transcription_id, old_names, new_name):
        collection = self.mongo_db["transcripts"]
        update_result = collection.update_many(
            {"_id": ObjectId(transcription_id), "segments.speaker": {"$in": old_names}},
            {
                "$set": {"segments.$[].speaker": new_name}
            },  # Use $[] to update all matching elements in the array
        )

        if update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def rename_selected_segments(
        self, transcription_id, old_names, new_name, segment_ids
    ):
        collection = self.mongo_db["transcripts"]

        # Convert segment_ids to integers
        segment_ids = [int(segment_id) for segment_id in segment_ids]

        # Use integer segment IDs directly
        update_result = collection.update_many(
            {
                "_id": ObjectId(transcription_id),
                "segments.id": {"$in": segment_ids},  # Match segments by integer ID
                "segments.speaker": {"$in": old_names},  # Match the old speaker names
            },
            {"$set": {"segments.$[elem].speaker": new_name}},  # Update the speaker name
            array_filters=[
                {"elem.id": {"$in": segment_ids}, "elem.speaker": {"$in": old_names}}
            ],  # Apply update to all matching segments
        )

        if update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def rename_transcribed_text(self, transcription_id, changes):
        collection = self.mongo_db["transcripts"]
        updates = 0

        for change in changes:
            segment_id = int(change["segmentId"])
            current_text = change["currentText"]

            # Update the specific segment's text field based on the segment ID
            update_result = collection.update_one(
                {"_id": ObjectId(transcription_id), "segments.id": segment_id},
                {"$set": {"segments.$.text": current_text}},
            )

            # Check if the segment was updated successfully
            self.logger.info(
                f"Update result: Matched {update_result.matched_count}, Modified {update_result.modified_count} for Segment ID {segment_id}"
            )

            updates += update_result.modified_count

        # Log the total number of segments updated
        self.logger.info(f"Total segments updated: {updates}")

        # Return the appropriate response based on the updates made
        if updates > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def rename_selected_texts(self, transcription_id, old_texts, new_text, segment_ids):
        collection = self.mongo_db["transcripts"]

        # Find and update the specified segments based on their integer IDs
        update_result = collection.update_many(
            {
                "_id": ObjectId(transcription_id),
                "segments.id": {"$in": segment_ids},  # Match segments by integer ID
                "segments.text": {"$in": old_texts},  # Ensure the text matches as well
            },
            {
                "$set": {
                    "segments.$[elem].text": new_text,
                    "text": self.replace_text_in_full_text(
                        collection, transcription_id, old_texts, new_text
                    ),
                }
            },
            array_filters=[
                {"elem.id": {"$in": segment_ids}}
            ],  # Apply update to matching segments
        )

        if update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def replace_text_in_full_text(
        self, transcripts_collection, transcription_id, old_texts, new_text
    ):
        transcript = transcripts_collection.find_one(
            {"_id": ObjectId(transcription_id)}
        )
        if transcript:
            full_text = transcript.get("full_text", "")
            for old_text in old_texts:
                full_text = full_text.replace(old_text, new_text)
            return full_text
        return ""

    def delete_transcription(self, transcription_id):
        collection = self.mongo_db["transcripts"]

        delete_result = collection.delete_one({"_id": ObjectId(transcription_id)})

        if delete_result.deleted_count > 0:
            return {"status": "success", "deleted_count": delete_result.deleted_count}
        else:
            return {"status": "no changes made"}

    def delete_segments(self, transcription_id, segment_ids):
        collection = self.mongo_db["transcripts"]

        # Convert string segment IDs to ObjectIds
        object_ids = [ObjectId(segment_id) for segment_id in segment_ids]

        # Pull specific segments from the array
        update_result = collection.update_one(
            {"_id": ObjectId(transcription_id)},
            {"$pull": {"segments": {"_id": {"$in": object_ids}}}},
        )

        if update_result.modified_count > 0:
            return {"status": "success"}
        else:
            return {"status": "no changes made"}

    def get_all_transcriptions(self):
        try:
            collection = self.mongo_db["transcripts"]
            cursor = collection.find({})

            all_transcriptions = []
            for doc in cursor:
                # Convert ObjectId to string for the transcription ID
                doc["_id"] = str(doc["_id"])

                # Convert ObjectId to string for each segment if any
                if "segments" in doc:
                    for segment in doc["segments"]:
                        if isinstance(segment.get("_id"), ObjectId):
                            segment["_id"] = str(segment["_id"])

                all_transcriptions.append(doc)

            return all_transcriptions
        except Exception as e:
            self.logger.info(f"Database error: {str(e)}")
            return {"error": str(e)}

    def get_transcription(self, id):
        try:
            transcripts_collection = self.mongo_db["transcripts"]

            # Convert the string ID to ObjectId
            object_id = ObjectId(id)

            # Find the transcription by ObjectId
            transcription = transcripts_collection.find_one({"_id": object_id})
            if not transcription:
                self.logger.error(f"No transcription found for ID: {id}")
                return {"error": "No transcription found for this ID"}

            # Convert ObjectId to string for the transcription ID
            transcription["_id"] = str(transcription["_id"])

            # Convert ObjectId to string for each segment if any
            if "segments" in transcription:
                for segment in transcription["segments"]:
                    if isinstance(segment.get("_id"), ObjectId):
                        segment["_id"] = str(segment["_id"])

            return transcription
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
            self.emit_progress(transcript_id, 10)

            wav_filename = f"{transcript_id}.wav"
            wav_file_path = os.path.join("temp", wav_filename)

            # Save the original file temporarily for conversion
            original_file_path = os.path.join("temp", secure_filename(file.filename))
            file.save(original_file_path)

            # Convert the file to WAV format if necessary
            if original_file_path.endswith((".mp4", ".mp3", ".avi")):
                original = AudioSegment.from_file(original_file_path)
                original.export(wav_file_path, format="wav")
                os.remove(
                    original_file_path
                )  # Remove the original file after conversion
            else:
                # If the file is already in WAV format, just rename it
                os.rename(original_file_path, wav_file_path)

            self.file_path = wav_file_path
            self.emit_progress(transcript_id, 30)

            model_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "large-v3")
            )
            processor = AudioProcessor(
                self.file_path, self.device, model_name=model_dir
            )
            transcription = processor.process()
            self.emit_progress(transcript_id, 50)

            created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            self.emit_progress(transcript_id, 70)

            response_data = {
                "id": transcript_id,
                "name": wav_filename,
                "transcription": transcription,
                "created_at": created_at,
            }

            # Insert the transcription with segments into the transcripts collection
            self.mongo_db.transcripts.insert_one(
                {
                    "_id": ObjectId(transcript_id),
                    "name": wav_filename,
                    "created_at": created_at,
                    "text": transcription["text"],  # Keep the text field intact
                    "segments": transcription[
                        "segments"
                    ],  # Keep segments as returned by processor
                }
            )

            self.emit_progress(transcript_id, 100)  # Process complete
            return response_data
        except Exception as e:
            self.logger.exception("Failed during processing")
            self.emit_progress(transcript_id, 0)  # Reset progress on failure
            return {"error": str(e)}

    def rename_transcription(self, transcription_id, new_name):
        try:
            # Access the transcripts collection from the MongoDB database
            collection = self.mongo_db["transcripts"]

            # Find the transcription by its ID
            transcription = collection.find_one({"_id": ObjectId(transcription_id)})

            if not transcription:
                # If the transcription is not found, return an error message
                self.logger.error(f"Transcription not found for ID: {transcription_id}")
                return {"error": "Transcription not found"}

            # Update the transcription name
            update_result = collection.update_one(
                {"_id": ObjectId(transcription_id)}, {"$set": {"name": new_name}}
            )

            if update_result.modified_count > 0:
                # If the update was successful, return a success message
                self.logger.info(
                    f"Transcription ID {transcription_id} renamed to {new_name}"
                )
                return {"message": "Transcription renamed successfully"}
            else:
                # If no changes were made, return a relevant message
                self.logger.info(
                    f"No changes made for transcription ID {transcription_id}"
                )
                return {"status": "no changes made"}

        except Exception as e:
            # If an exception occurs, log the error and return an error message
            self.logger.error(
                f"Error during renaming transcription: {str(e)}", exc_info=True
            )
            return {
                "error": f"An error occurred while renaming the transcription: {str(e)}"
            }

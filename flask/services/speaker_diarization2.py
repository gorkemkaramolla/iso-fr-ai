from flask import jsonify, Blueprint, request
from werkzeug.utils import secure_filename
from pyannote.audio import Pipeline
import whisper
from pydub import AudioSegment
import torch
import os
from datetime import datetime
import json
from bson import ObjectId
import logging
# from db import cursor, connection, LOB, ERROR
from db import mongo_client, mongo_db
from socketio_instance import socketio
from logger import configure_logging
from pyannote.audio.pipelines.utils.hook import ProgressHook
# import oracledb
class SpeakerDiarizationProcessor:
    def __init__(self,device):
        self.mongo_client = mongo_client
        self.mongo_db = mongo_db
        self.device = device
        self.hf_auth_token = os.getenv("HF_AUTH_TOKEN")
        self.logger = configure_logging()
        self.audio_bp = Blueprint('audio_bp', __name__)
        self.pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=self.hf_auth_token
        )
        self.pipeline.to(torch.device(self.device))
        self.whisper_model = None

    def emit_progress(self, progress):
        socketio.emit('progress', {'progress': progress})

    # def rename_segments(self, transcription_id, old_name, new_name):
    #     cursor.execute("""
    #                 UPDATE ze_iso_ai_segments 
    #                 SET SPEAKER = :new_name 
    #                 WHERE SPEAKER = :old_name AND TRANSCRIPT_ID = :transcription_id
    #                 """,
    #                 {
    #                     "new_name": new_name, 
    #                     "old_name": old_name, 
    #                     "transcription_id": transcription_id
    #                 })
    #     connection.commit()
    #     return {"status": "success"}, 200

    def rename_segments(self, transcription_id, old_name, new_name):
        # Access the collection
        collection = self.mongo_db['segments']
        
        # MongoDB update operation
        update_result = collection.update_many(
            {"speaker": old_name, "transcript_id": transcription_id},
            {"$set": {"speaker": new_name}}
        )
        
        if update_result.modified_count > 0:
            return {"status": "success"}, 200
        else:
            return {"status": "no changes made"}, 200



    # def get_all_transcriptions(self):
    #     try:
    #         cursor.execute(
    #             """
    #             SELECT TRANSCRIPT_ID, CREATED_AT
    #             FROM ze_iso_ai_transcripts
    #             """
    #         )
    #         transcriptions = cursor.fetchall()
    #         if not transcriptions:
    #             return jsonify(error="No transcriptions found"), 404

    #         all_transcriptions = [
    #             {
    #                 'transcription_id': transcription[0],
    #                 'created_at': transcription[1]
    #             }
    #             for transcription in transcriptions
    #         ]
    #         self.logger.info(f"Transcriptions: {all_transcriptions} successfully fetched from database")
    #         return jsonify(all_transcriptions), 200
    #     except ERROR as e:
    #         self.logger.error(f"Database error: {str(e)}")
    #         return jsonify(error=str(e)), 500
    def get_all_transcriptions(self):
        try:
            # Access the collection
            collection = self.mongo_db['transcripts']

            # Fetch all documents from the collection
            cursor = collection.find({})

            # Check if the collection has any documents
            # if cursor.count() == 0:
            #     return jsonify(error="No transcriptions found"), 404

            # Extract necessary fields
            all_transcriptions = [
                {
                    'transcription_id': str(doc['_id']),
                    'created_at': doc['created_at'],
                    'full_text': doc.get('full_text', '')  # Optionally include full text if you want to show it
                }
                for doc in cursor
            ]
            self.logger.info(f"Transcriptions: {all_transcriptions} successfully fetched from database")
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
            self.logger.error(f"Invalid date encountered: {e}, Date Value: {date_value}")
            return None
        except AttributeError as e:
            self.logger.error(f"Attribute error: {e}, Date Value: {date_value}")
            return None


    # def lob_to_string(self, lob_value):
    #     if lob_value is not None:
    #         return lob_value.read()
    #     return None
    
    def get_transcription(self, id):
        try:
            # Access the collection
            transcripts_collection = self.mongo_db['transcripts']
            segments_collection = self.mongo_db['segments']

            # Fetch the transcription document
            transcription = transcripts_collection.find_one({'_id': id})
            if not transcription:
                self.logger.error(f"No transcription found for ID: {id}")
                return jsonify(error="No transcription found for this ID"), 404

            # Fetch related segments
            segments = list(segments_collection.find({'transcript_id': id}))

            if not segments:
                self.logger.error(f"No transcription segments found for ID: {id}")
                return jsonify(error="No transcription segments found for this ID"), 404

            # Construct response data
            segments_data = [
                {
                    'segment_id': str(segment['_id']),
                    'start_time': segment['start_time'],
                    'end_time': segment['end_time'],
                    'speaker': segment['speaker'],
                    'transcribed_text': segment['transcribed_text']
                }
                for segment in segments
            ]

            result = {
                'transcription_id': str(transcription['_id']),
                'created_at': transcription['created_at'],
                'full_text': transcription.get('full_text', ''),
                'segments': segments_data
            }
            self.logger.info(f"get_transcription: {result} successfully fetched from database")
            return jsonify(result), 200
        except Exception as e:
            error_message = f"Error during transcription retrieval: {e}"
            self.logger.error(error_message)
            return jsonify(error="An error occurred while retrieving the transcription."), 500
    
    
    
    
    
    
    
    # def get_transcription(self, id):
    #     self.logger.info(f"Fetching transcription for ID: {id}")  # Log the ID being processed
    #     try:
    #         cursor.execute(
    #             """
    #             SELECT TRANSCRIPT_ID, TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
    #             FROM ze_iso_ai_transcripts
    #             WHERE TRANSCRIPT_ID = :transcript_id
    #             """,
    #             {"transcript_id": id}
    #         )
    #         transcription = cursor.fetchone()
    #         self.logger.debug(f"Transcription fetch result: {transcription}")  # Log the fetched result

    #         if not transcription:
    #             self.logger.warning(f"No transcription found for ID: {id}")
    #             return jsonify(error="No transcription found for this ID"), 404

    #         cursor.execute(
    #             """
    #             SELECT SEGMENT_ID, START_TIME, END_TIME, SPEAKER, TRANSCRIPT_ID, TRANSCRIBED_TEXT
    #             FROM ze_iso_ai_segments
    #             WHERE TRANSCRIPT_ID = :transcript_id
    #             """,
    #             {"transcript_id": id}
    #         )
    #         rows = cursor.fetchall()
    #         self.logger.debug(f"Segment fetch results: {rows}")  # Log segment results

    #         if not rows:
    #             self.logger.warning(f"No transcription segments found for ID: {id}")
    #             return jsonify(error="No transcription segments found for this ID"), 404

    #         segments = []
    #         for row in rows:
    #             segment = {desc[0]: val for desc, val in zip(cursor.description, row)}
    #             self.logger.debug(f"Processing segment: {segment}")  # Log each segment before processing
    #             if isinstance(segment.get('TRANSCRIBED_TEXT'), oracledb.LOB):
    #                 segment['TRANSCRIBED_TEXT'] = self.lob_to_string(segment['TRANSCRIBED_TEXT'])
    #             segment['CREATED_AT'] = self.safe_parse_date(segment.get('CREATED_AT'))
    #             segments.append(segment)

    #         result = {
    #             'transcription_id': transcription[0],
    #             'created_at': self.safe_parse_date(transcription[1]) if transcription[1] else None,
    #             'segments': segments
    #         }
    #         self.logger.info(f"get_transcription: {result} successfully fetched from database")
    #         return jsonify(result), 200

    #     except Exception as e:
    #         error_message = f"Error during transcription retrieval: {e}"
    #         self.logger.error(error_message)
    #         return jsonify(error="An error occurred while retrieving the transcription."), 500
    
    def process_audio(self, client_id):
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
                self.whisper_model = whisper.load_model("large", device=self.device)

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
            transcript_id = str(ObjectId())

            response_data = {
                'id': transcript_id,
                'transcription': transcription,
                'created_at': created_at
            }

            self.mongo_db.transcripts.insert_one({
                '_id': transcript_id,
                'created_at': created_at,
                'full_text': transcription['text']
            })
            
            for segment in transcription['segments']:
                self.mongo_db.segments.insert_one({
                    'transcript_id': transcript_id,
                    'start_time': segment['start'],
                    'end_time': segment['end'],
                    'transcribed_text': segment['text'],
                    'speaker': segment['speaker']
                })

            return jsonify(response_data), 200
        except Exception as e:
            self.logger.exception("Failed during processing")
            self.emit_progress(0)
            return jsonify({'error': str(e)}), 500
        
        
        
        
        
        
        
        
        
    #  Process Audio
    # def process_audio(self,client_id):
    #     self.logger.info("New transcription request received")
    #     if 'file' not in request.files:
    #         self.logger.error("No file part in request")
    #         return jsonify({'error': 'No file part'}), 400
        
    #     file = request.files['file']
    #     if file.filename == '':
    #         self.logger.error("No file selected")
    #         return jsonify({'error': 'No selected file'}), 400
        
    #     filename = secure_filename(file.filename)
    #     file_path = os.path.join("temp", filename)
    #     file.save(file_path)

    #     try:
    #         if filename.endswith(('.mp4', '.mp3', '.avi')):
    #             original = AudioSegment.from_file(file_path)
    #             wav_path = f"{os.path.splitext(file_path)[0]}.wav"
    #             original.export(wav_path, format='wav')
    #             file_path = wav_path

    #         self.emit_progress(10)
    #         if not self.whisper_model:
    #             torch.cuda.empty_cache()
    #             self.whisper_model = whisper.load_model("large", device=self.device)

    #         audio_data = whisper.load_audio(file_path)
    #         self.emit_progress(30)

    #         with ProgressHook() as hook:
    #             diarization = self.pipeline(file_path, hook=hook)
    #         self.emit_progress(50)

    #         diarization_segments = [
    #             {'start': round(turn.start, 2), 'end': round(turn.end, 2), 'speaker': speaker}
    #             for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)
    #         ]

    #         self.emit_progress(70)
    #         transcription = whisper.transcribe(self.whisper_model, audio_data, language="tr")

    #         for segment in transcription['segments']:
    #             closest_segment = min(
    #                 diarization_segments,
    #                 key=lambda x: min(abs(x['start'] - segment['start']), abs(x['end'] - segment['end']))
    #             )
    #             segment['speaker'] = closest_segment['speaker'] if closest_segment else None

    #         self.emit_progress(90)
    #         transcription_file = f"{filename}_transcription.json"
    #         with open(os.path.join("temp", transcription_file), 'w') as f:
    #             f.write(json.dumps(transcription))
    #         self.emit_progress(100)

    #         created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    #         cursor.execute("SELECT IBS.SEQ_TRANSCRIPT_ID.NEXTVAL FROM dual")
    #         transcript_id = cursor.fetchone()[0]

    #         response_data = {
    #             'id': transcript_id,
    #             'transcription': transcription,
    #             'created_at': created_at
    #         }
    #         cursor.execute(
    #             "INSERT INTO ze_iso_ai_transcripts (TRANSCRIPT_ID, CREATED_AT, FULL_TEXT) VALUES (:transcript_id, TO_TIMESTAMP(:created_at, 'YYYY-MM-DD HH24:MI:SS.FF'), :full_text)",
    #             {"transcript_id": transcript_id, "created_at": created_at, "full_text": transcription['text']}
    #         )
    #         connection.commit()
            
    #         for segment in transcription['segments']:
    #             cursor.execute(
    #                 "INSERT INTO ze_iso_ai_segments (SEGMENT_ID, TRANSCRIPT_ID, START_TIME, END_TIME, TRANSCRIBED_TEXT, SPEAKER) "
    #                 "VALUES (IBS.SEQ_SEGMENT_ID.NEXTVAL, :transcript_id, :start_time, :end_time, :transcribed_text, :speaker)",
    #                 {
    #                     "transcript_id": transcript_id,
    #                     "start_time": segment['start'],
    #                     "end_time": segment['end'],
    #                     "transcribed_text": segment['text'],
    #                     "speaker": segment['speaker']
    #                 }
    #             )
    #         connection.commit()

    #         return jsonify(response_data), 200
    #     except Exception as e:
    #         self.logger.exception("Failed during processing")
    #         self.emit_progress(0)
    #         return jsonify({'error': str(e)}), 500

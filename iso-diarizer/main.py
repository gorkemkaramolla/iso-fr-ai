# from datetime import datetime
# from faster_whisper import WhisperModel
# from pyannote_onnx import PyannoteONNX
# from typing import List, Dict
# import json
# from pymongo import MongoClient
# from bson import ObjectId

# class AudioTranscriber:
#     def __init__(self, wav_path: str, db_uri: str = "mongodb://localhost:27017/"):
#         self.wav_path = wav_path
#         self.pyannote = PyannoteONNX()
#         self.model = WhisperModel("large-v3", device="cuda", compute_type="float16")
#         self.diarizer_progress = 0
#         self.transcriber_progress = 0
#         self.client = MongoClient(db_uri)
#         self.db = self.client.audio_transcriptions

#     def process_diarization(self):
#         diarizer_output = []
#         for turn in self.pyannote.itertracks(self.wav_path):
#             diarizer_output.append({
#                 "speaker": f"SPEAKER_{turn['speaker']}",
#                 "start": turn['start'],
#                 "stop": turn['stop']
#             })
#             self.diarizer_progress += 1  # This is an approximation
#         return diarizer_output

#     def process_transcription(self):
#         segments, info = self.model.transcribe(self.wav_path, beam_size=5, language="tr", hallucination_silence_threshold=0.1)
#         transcriber_output = []
#         total_duration = info.duration
#         for segment in segments:
#             transcriber_output.append({"start": segment.start, "end": segment.end, "text": segment.text})
#             self.transcriber_progress = min(100, int((segment.end / total_duration) * 100))
#         return transcriber_output, info

#     def merge_outputs(self, diarizer_output: List[Dict], transcriber_output: List[Dict]) -> List[Dict]:
#         merged = []
#         for turn in diarizer_output:
#             merged.append({
#                 "speaker": turn["speaker"],
#                 "start": turn["start"],
#                 "end": turn["stop"],
#                 "text": ""
#             })
        
#         for segment in transcriber_output:
#             merged.append({
#                 "speaker": None,
#                 "start": segment["start"],
#                 "end": segment["end"],
#                 "text": segment["text"]
#             })
        
#         merged.sort(key=lambda x: x["start"])
        
#         current_speaker = None
#         for item in merged:
#             if item["speaker"] is not None:
#                 current_speaker = item["speaker"]
#             elif current_speaker is not None:
#                 item["speaker"] = current_speaker
        
#         merged = [item for item in merged if item["text"]]
#         return merged

#     def process_audio(self):
#         print("Processing diarization...")
#         diarizer_output = self.process_diarization()
        
#         print("Transcribing audio...")
#         transcriber_output, info = self.process_transcription()
        
#         print("Merging outputs...")
#         merged_output = self.merge_outputs(diarizer_output, transcriber_output)
        
#         return merged_output, info

#     def get_diarizer_progress(self):
#         return min(100, self.diarizer_progress)

#     def get_transcriber_progress(self):
#         return self.transcriber_progress

#     def insert_transcription(self, transcription: List[Dict], info: Dict):
#         document = {
#             "datetime": datetime.now(),
#             "file_path": self.wav_path,
#             "transcription": transcription,
#             "language": info.language,
#             "language_probability": info.language_probability
#         }
#         result = self.db.transcriptions.insert_one(document)
#         return result.inserted_id

#     def update_speaker_label(self, document_id: str, segment_index: int, new_speaker_label: str):
#         result = self.db.transcriptions.update_one(
#             {"_id": ObjectId(document_id)},
#             {"$set": {f"transcription.{segment_index}.speaker": new_speaker_label}}
#         )
#         return result.modified_count

#     def get_all_documents(self):
#         return list(self.db.transcriptions.find())

#     def get_document_by_id(self, document_id: str):
#         return self.db.transcriptions.find_one({"_id": ObjectId(document_id)})

# def main(wav_path: str = "test.mp3"):
#     transcriber = AudioTranscriber(wav_path)
    
#     merged_output, info = transcriber.process_audio()
    
#     print("\nMerged output:")
#     print(json.dumps(merged_output, indent=2, ensure_ascii=False))
    
#     print(f"\nDetected language '{info.language}' with probability {info.language_probability}")
    
#     # Insert the transcription into MongoDB
#     document_id = transcriber.insert_transcription(merged_output, info)
#     print(f"\nInserted document with ID: {document_id}")
    
#     # Example of updating a speaker label
#     update_result = transcriber.update_speaker_label(str(document_id), 0, "John Doe")
#     print(f"Updated {update_result} document(s)")
    
#     # Get all documents
#     all_docs = transcriber.get_all_documents()
#     print(f"\nTotal documents in database: {len(all_docs)}")

# if __name__ == "__main__":
#     main()

from faster_whisper import WhisperModel
from pyannote_onnx import PyannoteONNX
from typing import List, Dict
import json
from tqdm import tqdm
import time

def merge_outputs(diarizer_output: List[Dict], transcriber_output: List[Dict]) -> List[Dict]:
    merged = []
    for turn in diarizer_output:
        merged.append({
            "speaker": turn["speaker"],
            "start": turn["start"],
            "end": turn["stop"],
            "text": ""
        })
    
    for segment in transcriber_output:
        merged.append({
            "speaker": None,
            "start": segment["start"],
            "end": segment["end"],
            "text": segment["text"]
        })
    
    merged.sort(key=lambda x: x["start"])
    
    current_speaker = None
    for item in merged:
        if item["speaker"] is not None:
            current_speaker = item["speaker"]
        elif current_speaker is not None:
            item["speaker"] = current_speaker
    
    merged = [item for item in merged if item["text"]]
    return merged

def main(wav_path: str = "test.mp3", plot: bool = False):
    print("Initializing models...")
    pyannote = PyannoteONNX()
    model_size = "./large-v3/"
    model = WhisperModel(model_size, device="cuda", compute_type="float16")
    
    print("Processing diarization...")
    diarizer_output = []
    with tqdm(total=100, desc="Diarization") as pbar:
        for turn in pyannote.itertracks(wav_path):
            diarizer_output.append(turn)
            pbar.update(1)  # This is an approximation, adjust as needed
    
    print("Transcribing audio...")
    segments, info = model.transcribe(wav_path, beam_size=5, language="tr", hallucination_silence_threshold=0.1)
    
    print("Processing transcription...")
    transcriber_output = []
    total_duration = info.duration
    with tqdm(total=100, desc="Transcription") as pbar:
        for segment in segments:
            transcriber_output.append({"start": segment.start, "end": segment.end, "text": segment.text})
            progress = min(100, int((segment.end / total_duration) * 100))
            pbar.update(progress - pbar.n)
    
    print("Merging outputs...")
    merged_output = merge_outputs(diarizer_output, transcriber_output)
    
    print("\nMerged output:")
    print(json.dumps(merged_output, indent=2, ensure_ascii=False))
    
    # print(f"\nDetected language '{info.language}' with probability {info.language_probability}")

if __name__ == "__main__":
    main()
# from faster_whisper import WhisperModel
# from pyannote_onnx import PyannoteONNX
# from typing import List, Dict
# import json

# def merge_outputs(diarizer_output: List[Dict], transcriber_output: List[Dict]) -> List[Dict]:
#     merged = []
#     for turn in diarizer_output:
#         merged.append({
#             "speaker": turn["speaker"],
#             "start": turn["start"],
#             "end": turn["stop"],
#             "text": ""
#         })
    
#     for segment in transcriber_output:
#         merged.append({
#             "speaker": None,
#             "start": segment["start"],
#             "end": segment["end"],
#             "text": segment["text"]
#         })
    
#     # Sort the merged list based on start time
#     merged.sort(key=lambda x: x["start"])
    
#     # Assign speaker to transcribed segments
#     current_speaker = None
#     for item in merged:
#         if item["speaker"] is not None:
#             current_speaker = item["speaker"]
#         elif current_speaker is not None:
#             item["speaker"] = current_speaker
    
#     # Remove entries without text
#     merged = [item for item in merged if item["text"]]
    
#     return merged

# def main(wav_path: str = "asd.mp3", plot: bool = False):
#     pyannote = PyannoteONNX()
    
#     # Get diarizer output
#     diarizer_output = []
#     for turn in pyannote.itertracks(wav_path):
#         diarizer_output.append(turn)
    
#     model_size = "large-v3"
#     model = WhisperModel(model_size, device="cuda", compute_type="float16")
    
#     # Get transcriber output
#     segments, info = model.transcribe(wav_path, beam_size=5, language="tr", hallucination_silence_threshold=0.1)
#     transcriber_output = [{"start": segment.start, "end": segment.end, "text": segment.text} for segment in segments]
    
#     # Merge outputs
#     merged_output = merge_outputs(diarizer_output, transcriber_output)
    
#     # Print merged output
#     print(json.dumps(merged_output, indent=2, ensure_ascii=False))
    
#     # Print language detection info
#     print(f"Detected language '{info.language}' with probability {info.language_probability}")

# if __name__ == "__main__":
#     main()


# from faster_whisper import WhisperModel
# from pyannote_onnx import PyannoteONNX


# def main(wav_path: str = "asd.mp3", plot: bool = False):
#     pyannote = PyannoteONNX()
    
#     # Print VAD information
#     for turn in pyannote.itertracks(wav_path):
#         print(turn)

#     model_size = "large-v3"

#     # Run on GPU with FP16
#     model = WhisperModel(model_size, device="cuda", compute_type="float16")


#     segments, info = model.transcribe("asd.mp3", beam_size=5, language="tr", hallucination_silence_threshold=0.1)

#     print("Detected language '%s' with probability %f" % (info.language, info.language_probability))

#     for segment in segments:
#         print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))

# if __name__ == "__main__":
#     main()
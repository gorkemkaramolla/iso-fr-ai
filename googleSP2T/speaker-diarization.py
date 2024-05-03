
# from pyannote.audio import Pipeline
# pipeline = Pipeline.from_pretrained(
#     "pyannote/speaker-diarization-3.1",
#     use_auth_token="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")  # Replace with your actual token

# # run the pipeline on an audio file
# diarization = pipeline("test.wav")

# # dump the diarization output to disk using RTTM format
# with open("audio.txt", "w") as txt:
#     for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start):
#         start_time = round(turn.start, 2)
#         end_time = round(turn.end, 2)
#         txt.write(f"{start_time}s-{end_time}s {speaker} speaking.\n")
        
# import whisper_timestamped as whisper

# audio = whisper.load_audio("test.wav")

# model = whisper.load_model("large", device="cpu")

# result = whisper.transcribe(model, audio, language="tr")

# import json

# result_dict = json.loads(result) if isinstance(result, str) else result

# fields_to_remove = ['tokens', 'temperature', 'avg_logprob', 'compression_ratio', 'no_speech_prob']

# for segment in result_dict['segments']:
#     for field in fields_to_remove:
#         if field in segment:
#             del segment[field]

# print(json.dumps(result_dict, indent=2, ensure_ascii=False))
# from pyannote.audio import Pipeline
# import whisper
# import json

# # Load the Pyannote pipeline
# pipeline = Pipeline.from_pretrained(
#     "pyannote/speaker-diarization-3.1",
#     use_auth_token="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")  # Replace 'your_huggingface_token' with your actual Hugging Face token

# # Run the pipeline on an audio file
# diarization = pipeline("test.wav")

# # Prepare diarization data
# speaker_segments = []
# for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start):
#     speaker_segments.append({
#         'start': round(turn.start, 2),
#         'end': round(turn.end, 2),
#         'speaker': speaker
#     })

# # Load audio and run Whisper model
# whisper_model = whisper.load_model("large", device="cpu")
# audio = whisper.load_audio("test.wav")
# result = whisper.transcribe(whisper_model, audio, language="tr")

# # Assuming result is already a dictionary
# result_dict = result if isinstance(result, dict) else json.loads(result)

# # Match speaker labels to Whisper segments based on time overlap
# for segment in result_dict['segments']:
#     segment_start = segment['start']
#     segment_end = segment['end']
#     # Match segments to speakers based on overlap
#     for speaker_segment in speaker_segments:
#         if (segment_start < speaker_segment['end'] and segment_end > speaker_segment['start']):
#             segment['speaker'] = speaker_segment['speaker']
#             break

# # Optionally remove unwanted fields
# fields_to_remove = ['tokens', 'temperature', 'avg_logprob', 'compression_ratio', 'no_speech_prob']
# for segment in result_dict['segments']:
#     for field in fields_to_remove:
#         if field in segment:
#             del segment[field]

# # Output the modified JSON
# print(json.dumps(result_dict, indent=2, ensure_ascii=False))
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pyannote.audio import Pipeline
import whisper
from typing import List

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Pyannote pipeline
pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token="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")

# Load Whisper model
whisper_model = whisper.load_model("large", device="cpu")

@app.post("/process-audio/")
async def process_audio(file: UploadFile = File(...)):
    with open("temp_audio_file.wav", "wb") as buffer:
        buffer.write(await file.read())

    # Perform diarization
    diarization = pipeline("temp_audio_file.wav")
    speaker_segments = [{
        'start': round(turn.start, 2),
        'end': round(turn.end, 2),
        'speaker': speaker
    } for turn, _, speaker in sorted(diarization.itertracks(yield_label=True), key=lambda x: x[0].start)]

    # Transcribe audio
    audio = whisper.load_audio("temp_audio_file.wav")
    result = whisper.transcribe(whisper_model, audio, language="tr")

    # Match speakers
    for segment in result['segments']:
        for speaker_segment in speaker_segments:
            if segment['start'] < speaker_segment['end'] and segment['end'] > speaker_segment['start']:
                segment['speaker'] = speaker_segment['speaker']
                break

    # Cleanup fields
    for segment in result['segments']:
        for field in ['tokens', 'temperature', 'avg_logprob', 'compression_ratio', 'no_speech_prob']:
            segment.pop(field, None)

    return result


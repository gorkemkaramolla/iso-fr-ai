# import sounddevice as sd
# import numpy as np
# import io
# import wave
# from faster_whisper import WhisperModel

# # Initialize the Whisper model
# model = WhisperModel("tiny", compute_type="int8")

# def transcribe_audio(audio):
#     # Prepare an in-memory WAV file
#     with io.BytesIO() as audio_buffer:
#         # Use wave to write audio as a WAV file
#         with wave.open(audio_buffer, 'wb') as wf:
#             wf.setnchannels(1)
#             wf.setsampwidth(2)  # Assuming 16-bit audio
#             wf.setframerate(sample_rate)
#             wf.writeframes(audio.tobytes())
#         audio_buffer.seek(0)

#         # Transcribe using the Whisper model
#         segments, _ = model.transcribe(audio_buffer, language="tr")
#         text = "".join(segment.text for segment in segments)

#         print(text)

# # Recording settings
# sample_rate = 16000  # Hz
# duration = 5  # seconds

# # Continuously record and transcribe audio
# while True:
#     audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='int16')
#     sd.wait()  # Wait for the recording to finish
#     transcribe_audio(audio)
# Load model directly
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from datasets import load_dataset
import soundfile as sf


device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

model_id = "openai/whisper-large-v3"

model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True

)
model.to(device)

processor = AutoProcessor.from_pretrained(model_id)

pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    max_new_tokens=128,
    chunk_length_s=30,
    batch_size=1,
    return_timestamps=True,
    torch_dtype=torch_dtype,
    device=device,
)


# Load the WAV file
audio, sample_rate = sf.read("insanim.wav")

# Process the audio file
input_values = processor(audio, sampling_rate=sample_rate, return_tensors="pt").input_values

# Perform the transcription
result = pipe(input_values)

print(result["text"])

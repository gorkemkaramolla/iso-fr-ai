# import torch
# from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
# from datasets import load_dataset


# device = "cuda:0" if torch.cuda.is_available() else "cpu"
# torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# model_id = "openai/whisper-large-v3"

# model = AutoModelForSpeechSeq2Seq.from_pretrained(
#     model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
# )
# model.to(device)

# processor = AutoProcessor.from_pretrained(model_id)

# pipe = pipeline(
#     "automatic-speech-recognition",
#     model=model,
#     tokenizer=processor.tokenizer,
#     feature_extractor=processor.feature_extractor,
#     max_new_tokens=128,
#     chunk_length_s=30,
#     batch_size=16,
#     return_timestamps=True,
#     torch_dtype=torch_dtype,
#     device=device,
# )

# dataset = load_dataset("distil-whisper/librispeech_long", "clean", split="validation")
# sample = dataset[0]["audio"]

# result = pipe("small.wav")
# print(result["text"])
import torch
import sounddevice as sd
import numpy as np
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

# Function to capture audio from the microphone
def record_audio(duration=10, sr=16000):
    print("Recording...")
    audio = sd.rec(int(duration * sr), samplerate=sr, channels=1, dtype="int16")
    sd.wait()
    return audio.flatten()

device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

model_id = "openai/whisper-large-v3"

model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
)
# model = model.to_bettertransformer()
model.to(device)

processor = AutoProcessor.from_pretrained(model_id)
# Set the language to Turkish in the model's config
model.config.target_language = "tr"

pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    max_new_tokens=128,
    chunk_length_s=30,
    batch_size=16,
    return_timestamps=True,
    torch_dtype=torch_dtype,
    device=device,
    generate_kwargs={"language": "turkish", "task": "transcribe"}
    # language="tr",
)

# Function to perform real-time speech recognition
def perform_realtime_speech_recognition():
    while True:
        try:
            audio_input = record_audio()  # Record audio from the microphone
            audio_input = audio_input.astype(np.float32) / np.iinfo(np.int16).max  # Normalize audio
            result = pipe(audio_input)  # Perform speech recognition
            print("Recognized speech:", result["text"])
        except KeyboardInterrupt:
            print("Recording stopped.")
            break

# Perform real-time speech recognition
perform_realtime_speech_recognition()



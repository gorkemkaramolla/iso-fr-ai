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

# dataset = load_dadtaset("distil-whisper/librispeech_long", "clean", split="validation")
# sample = dataset[0]["audio"]

# result = pipe("small.wav")
# print(result["text"])
import torch
import numpy as np
import sounddevice as sd
from transformers import pipeline, AutoModelForSpeechSeq2Seq, AutoProcessor

# Device and dtype settings
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Model and processor setup
model_id = "openai/whisper-tiny"
model = AutoModelForSpeechSeq2Seq.from_pretrained(model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True).to(device)
processor = AutoProcessor.from_pretrained(model_id)
model.config.target_language = "tr"

# ASR pipeline
pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    max_new_tokens=128,
    chunk_length_s=1,
    batch_size=16,
    return_timestamps=True,
    torch_dtype=torch_dtype,
    device=device,
    generate_kwargs={"language": "turkish", "task": "transcribe"}
)

def record_audio_chunk(duration=1, sr=16000):
    audio = sd.rec(int(duration * sr), samplerate=sr, channels=1, dtype="int16")
    sd.wait()
    return audio.flatten()

def perform_realtime_speech_recognition():
    audio_buffer = np.array([], dtype=np.float32)
    try:
        while True:
            new_audio = record_audio_chunk()
            new_audio = new_audio.astype(np.float32) / np.iinfo(np.int16).max
            audio_buffer = np.concatenate((audio_buffer, new_audio))
            
            # Debug: Check the buffer size
            print(f"Buffer size: {len(audio_buffer)} samples")

            if len(audio_buffer) >= 16000:  # At least 1 second of audio
                result = pipe(audio_buffer)
                print("Recognized speech:", result.get("text", ""))  # Debug output
                audio_buffer = audio_buffer[8000:]  # Shift the buffer to maintain a continuous flow

    except KeyboardInterrupt:
        print("Recording stopped.")

perform_realtime_speech_recognition()


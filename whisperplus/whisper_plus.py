from whisperplus import (
    ASRDiarizationPipeline,
    download_and_convert_to_mp3,
    format_speech_to_dialogue,
)

audio_path = "../test.wav"

device = "cpu"  # cpu or mps
pipeline = ASRDiarizationPipeline.from_pretrained(
    asr_model="openai/whisper-large-v3",
    diarizer_model="pyannote/speaker-diarization",
    use_auth_token="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",
    chunk_length_s=30,
    device=device,
)

output_text = pipeline(audio_path, num_speakers=2, min_speaker=1, max_speaker=4)
dialogue = format_speech_to_dialogue(output_text)
print(dialogue)
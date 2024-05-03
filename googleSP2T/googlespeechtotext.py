from google.cloud import speech_v1
from google.cloud.speech_v1 import SpeechClient, RecognitionConfig, RecognitionAudio, RecognitionMetadata
import os
import datetime

try:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "rare-shadow-421306-321d6c306286.json"
    gcs_uri = 'gs://iso-ses-tanima/output.wav'

    client = SpeechClient()
    audio = RecognitionAudio(uri=gcs_uri)

    metadata = RecognitionMetadata()
    metadata.interaction_type = RecognitionMetadata.InteractionType.DISCUSSION
    metadata.microphone_distance = RecognitionMetadata.MicrophoneDistance.NEARFIELD
    metadata.recording_device_type = RecognitionMetadata.RecordingDeviceType.SMARTPHONE
    metadata.audio_topic = "A conversation between multiple people"

    config = RecognitionConfig(
        language_code="tr-TR",
        encoding=RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        use_enhanced=True,
        enable_automatic_punctuation=True,
        diarization_config=speech_v1.SpeakerDiarizationConfig(
            enable_speaker_diarization=True,
            min_speaker_count=1,
            max_speaker_count=6,
        ),
        enable_word_time_offsets=True,
        metadata=metadata
    )

    operation = client.long_running_recognize(config=config, audio=audio)
    print("Waiting for operation to complete...")
    response = operation.result(timeout=100000)

    transcript_output = {}
    for result in response.results:
        for alternative in result.alternatives:
            for word_info in alternative.words:
                speaker_tag = word_info.speaker_tag
                start_time = word_info.start_time.total_seconds()
                if speaker_tag not in transcript_output:
                    transcript_output[speaker_tag] = []
                transcript_output[speaker_tag].append((start_time, word_info.word))

    for speaker, segments in transcript_output.items():
        print(f"Speaker {speaker}, Segment count: {len(segments)}")

    with open("transcript_corrected.txt", "w") as f:
        for speaker, words in sorted(transcript_output.items()):
            current_time = None
            sentence = ""
            for time, word in words:
                if current_time is None:
                    current_time = time
                sentence += " " + word
                if word.endswith('.'):
                    formatted_time = str(datetime.timedelta(seconds=int(current_time)))
                    formatted_time = f"{formatted_time}"
                    f.write(f"Speaker {speaker} at {formatted_time}: \"{sentence.strip()}\"\n")
                    sentence = ""
                    current_time = None

    if not transcript_output:
        print("No transcriptions were found.")
    else:
        print("Transcription completed and saved.")

except Exception as e:
    print(f"An error occurred: {e}")

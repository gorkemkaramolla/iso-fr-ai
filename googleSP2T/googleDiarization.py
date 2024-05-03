from google.cloud import speech_v1p1beta1 as speech
import os

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "rare-shadow-421306-321d6c306286.json"

client = speech.SpeechClient()
gcs_uri = 'gs://iso-ses-tanima/output.wav'
audio = speech.RecognitionAudio(uri=gcs_uri)

diarization_config = speech.SpeakerDiarizationConfig(
    enable_speaker_diarization=True,
    min_speaker_count=2,
    max_speaker_count=10,
)
config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
    sample_rate_hertz=16000,
    language_code="tr_TR",
    diarization_config=diarization_config,
)

print("Waiting for operation to complete...")
operation = client.long_running_recognize(config=config, audio=audio)
response = operation.result(timeout=100000)

# The transcript within each result is separate and sequential per result.
# However, the words list within an alternative includes all the words
# from all the results thus far. Thus, to get all the words with speaker
# tags, you only have to take the words list from the last result:
result = response.results[-1]

words_info = result.alternatives[0].words

# Printing out the output:
# Open the file in write mode
with open('output.txt', 'w') as f:
    # Loop over the words_info
    for word_info in words_info:
        # Write each word and its speaker tag to the file
        f.write(f"word: '{word_info.word}', speaker_tag: {word_info.speaker_tag}\n")
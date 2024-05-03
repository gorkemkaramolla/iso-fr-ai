from google.cloud import speech_v1p1beta1 as speech
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "rare-shadow-421306-321d6c306286.json"

client = speech.SpeechClient()

speech_file = "test8000single.wav"

with open(speech_file, "rb") as audio_file:
    content = audio_file.read()

audio = speech.RecognitionAudio(content=content)

diarization_config = speech.SpeakerDiarizationConfig(
    enable_speaker_diarization=True,
    min_speaker_count=2,
    max_speaker_count=10,
    
)

config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
    sample_rate_hertz=8000,
    language_code="tr-TR",  

    diarization_config=diarization_config,
)

print("Waiting for operation to complete...")
response = client.recognize(config=config, audio=audio)

# The transcript within each result is separate and sequential per result.
# However, the words list within an alternative includes all the words
# from all the results thus far. Thus, to get all the words with speaker
# tags, you only have to take the words list from the last result:
result = response.results[-1]

words_info = result.alternatives[0].words

# Printing out the output:
for word_info in words_info:
    # Split the start and end times into hours, minutes, and seconds
    start_time_parts = str(word_info.start_time).split(':')
    end_time_parts = str(word_info.end_time).split(':')

    # Calculate the total seconds for the start and end times
    start_time_seconds = int(start_time_parts[0]) * 3600 + int(start_time_parts[1]) * 60 + float(start_time_parts[2])
    end_time_seconds = int(end_time_parts[0]) * 3600 + int(end_time_parts[1]) * 60 + float(end_time_parts[2])

    print(f"starttime:{start_time_seconds} endtime:{end_time_seconds} word: '{word_info.word}', speaker_tag: {word_info.speaker_tag}")

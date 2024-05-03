# import whisper
# import ssl
# import urllib.request

# # Create an unverified context
# ssl._create_default_https_context = ssl._create_unverified_context

# # Now you can call your function that uses urllib
# model = whisper.load_model("base")
# result = model.transcribe("output 2.wav", language="tr", fp16=False, verbose=True)
# print(f' The text in video: \n {result["text"]}')

# import whisper
# import pyaudio
# import wave
# import time
# import threading
# import urllib.request
# import websockets
# import asyncio
# Create an unverified context
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

# def record_to_wav(chunk=128, format=pyaudio.paInt32, channels=1, rate=16000, record_seconds=20, filename="output.wav", , device_index=0):
#   """Records live speech from the microphone and saves it to a WAV file in chunks."""

#   p = pyaudio.PyAudio()

#   # Create a stream with input from the microphone
#   stream = p.open(format=format,
#                   channels=channels,
#                   rate=rate,
#                   input=True,
#                   frames_per_buffer=chunk,
#                   input_device_index=device_index)  # Use the specified input device

#   print("Recording...")

#   frames = []
#   start_time = time.time()

#   while True:
#     data = stream.read(chunk)
#     frames.append(data)

#     # Check if recording time limit has been reached
#     if time.time() - start_time > record_seconds:
#       break

#   print("Recording stopped.")

#   # Stop the stream and close PyAudio
#   stream.stop_stream()
#   stream.close()
#   p.terminate()

#   # Save audio frames to a WAV file
#   wf = wave.open(filename, 'wb')
#   wf.setnchannels(channels)
#   wf.setsampwidth(p.get_sample_size(format))
#   wf.setframerate(rate)
#   wf.writeframes(b''.join(frames))
#   wf.close()

# def transcribe_wav(filename, model, language="tr", fp16=False, verbose=True):
#   """Transcribes a WAV file using the provided Whisper model."""

#   result = model.transcribe(filename, language=language, fp16=fp16, verbose=verbose)

# def main():
#   # Load Whisper model
#   model = whisper.load_model("large-v3")
  
#   while True:
#   # Create threads for recording and transcription
#     recording_thread = threading.Thread(target=record_to_wav)
#     transcription_thread = threading.Thread(target=transcribe_wav, args=("output.wav", model))

#     # Start the recording thread
#     recording_thread.start()

#     # Wait for the recording thread to finish (or use a queue to signal completion)
#     recording_thread.join()

#     # Start the transcription thread after recording is complete
#     transcription_thread.start()

#     # Allow the transcription thread to finish
#     transcription_thread.join()

# if __name__ == "__main__":
#   main()
import asyncio
import websockets
import wave
import whisper
import json
import os
import eventlet
import eventlet.wsgi
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS)
key_path = os.path.expanduser('../cert/localhost/localhost.decrypted.key')  
cert_path = os.path.expanduser('../cert/localhost/localhost.crt')  

ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)

# Load Whisper model
model = whisper.load_model("large-v3")

from pydub import AudioSegment
from pydub.playback import play

async def handle_audio(websocket, path):
    # print("WebSocket connection established.")
    print("WebSocket connection established with: ", websocket)
    try:
        async for message in websocket:
            # Check if message is not None or not empty
            print("Message received" +  message)
            if message:
                # Process received audio data (e.g., save to file, perform transcription)
                with wave.open('received_audio.wav', 'wb') as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(16000)
                    wf.writeframes(message)

                # Load audio file
                audio = AudioSegment.from_wav('received_audio.wav')

                # Play audio
                play(audio)

                # Transcribe received audio
                result = model.transcribe("received_audio.wav", language="tr", fp16=False, verbose=True)
                transcription = result["text"]
                print(f'The text in video: \n {transcription}')
                # Send transcription back to the client
                await websocket.send(transcription)
            else:
                print("No audio data received from the WebSocket.")
    except Exception as e:
        print(f'An error occurred: {e}')
      

start_server = websockets.serve(eventlet.wrap_ssl(handle_audio,   certfile=cert_path,
                       keyfile=key_path,
                       server_side=True), '10.15.95.233', 8000)
# Allow connections from any origin
start_server.allowed_origins = ['*']
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

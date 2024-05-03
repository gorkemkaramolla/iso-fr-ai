from flask import Flask, request
from flask_socketio import SocketIO, emit
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
from PIL import Image
import io
import base64
import numpy as np
import cv2
import ssl
import eventlet.wsgi
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

id_to_label = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}
processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")

def decode_image(data):
    # Remove the data URL prefix
    prefix, data = data.split(',', 1)

    data = base64.b64decode(data)
    data = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(data, flags=1)
    return image

@socketio.on('frame')
def handle_frame(data):
    image = decode_image(data)
    image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    inputs = processor(images=image, return_tensors="pt")
    outputs = emotion_model(**inputs)
    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
    top_prob, top_class_id = probabilities.topk(1, dim=-1)
    predicted_label = id_to_label[top_class_id.item()]
    predicted_probability = top_prob.item()
    emit('emotion', {'label': predicted_label, 'probability': predicted_probability})
if __name__ == '__main__':
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS)
    key_path = os.path.expanduser('../cert/localhost/localhost.decrypted.key')  
    cert_path = os.path.expanduser('../cert/localhost/localhost.crt')  

    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(cert_path, key_path)
    eventlet.wsgi.server(eventlet.wrap_ssl(eventlet.listen(('0.0.0.0', 5001)),
                       certfile=cert_path,
                       keyfile=key_path,
                       server_side=True), app)
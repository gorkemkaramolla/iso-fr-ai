from flask import Flask, render_template
from flask_socketio import SocketIO
import base64
from io import BytesIO
from PIL import Image
from datetime import datetime
import cv2
import numpy as np
import os
import torch
import os.path as osp
import onnxruntime
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX
from PIL import Image
from transformers import AutoModelForImageClassification, AutoImageProcessor
import asyncio
from flask_cors import CORS
import ssl
import eventlet
import eventlet.wsgi
from werkzeug.serving import run_simple
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app,  origins=["*"])
                    

onnxruntime.set_default_logger_severity(3)

assets_dir = osp.expanduser('~/.insightface/models/buffalo_l')
detector = SCRFD(os.path.join(assets_dir, 'det_10g.onnx'))
detector.prepare(0)
model_path = os.path.join(assets_dir, 'w600k_r50.onnx')
rec = ArcFaceONNX(model_path)
rec.prepare(0)

def create_face_database(model, face_detector, image_folder):
    database = {}
    for filename in os.listdir(image_folder):
        if filename.endswith((".jpg", ".png")):
            name = osp.splitext(filename)[0]
            image_path = osp.join(image_folder, filename)
            image = cv2.imread(image_path)
            bboxes, kpss = face_detector.autodetect(image, max_num=1)
            if bboxes.shape[0] > 0:
                kps = kpss[0]
                embedding = model.get(image, kps)
                database[name] = embedding
    return database

database = create_face_database(rec, detector, '../face-images/')
SIMILARITY_THRESHOLD = 0.4  # Set this to your preferred threshold
def func(image, database):
    bboxes, kpss = detector.autodetect(image, max_num=0)
    labels = []
    sims = []
    embeddings = []
    for kps in kpss:
        embedding = rec.get(image, kps)
        embeddings.append(embedding)
    for embedding in embeddings:
        min_dist = float('inf')
        best_match = None
        for name, db_embedding in database.items():
            dist = np.linalg.norm(db_embedding - embedding)
            if dist < min_dist:
                min_dist = dist
                best_match = name
        sim = rec.compute_sim(embedding, database[best_match])
        labels.append(best_match if sim >= SIMILARITY_THRESHOLD else "Unknown")
        sims.append(sim)
    return bboxes, labels, sims



# Move image decoding outside the frame handler function

def decode_image(encoded_image):
    header, encoded = encoded_image.split(",", 1)
    image_data = base64.b64decode(encoded)
    nparr = np.frombuffer(image_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# Perform face detection only when needed, based on a defined interval
detection_interval = 10  # Set your desired detection interval
frame_counter = 0
@app.route('/')
def home():
    return "Hello, World!"

@socketio.on('frame')
def handle_frame(data):
    global frame_counter
    # Increment the frame counter
    frame_counter += 1
    
    # Decode the image
    image = decode_image(data)
    
    # # Faces to recognize
    if frame_counter >= detection_interval:
            # Reset the frame counter
        frame_counter = 0
        
        # Process the frame
        bboxes, labels, sims = func(image, database)

        bounding_boxes = []

        # Emit processed data
        for bbox, label, sim in zip(bboxes, labels, sims):
            x1, y1, x2, y2 = map(int, bbox[:4])
            face = image[y1:y2, x1:x2]
            if face.size == 0:
                continue
            # Append data to lists
            bounding_boxes.append([x1, y1, x2, y2])
        # Example: Emitting back processed data. Adapt according to your needs.
        socketio.emit('webrtc', [{
            'label': label,
            'similarity': float(sim),
            'bboxes' :[bbox.tolist() for bbox in bboxes]
        } for label, sim in zip(labels, sims)])

if __name__ == '__main__':
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS)
    key_path = os.path.expanduser('../cert/localhost/localhost.decrypted.key')  
    cert_path = os.path.expanduser('../cert/localhost/localhost.crt')  

    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(cert_path, key_path)
    eventlet.wsgi.server(eventlet.wrap_ssl(eventlet.listen(('10.15.95.232', 5003)),
                       certfile=cert_path,
                       keyfile=key_path,
                       server_side=True), app)
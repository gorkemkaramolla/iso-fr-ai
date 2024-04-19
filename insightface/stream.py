import eventlet
import eventlet.wsgi
from flask import Flask
import cv2
import numpy as np
import os
import os.path as osp
import onnxruntime
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX
from PIL import Image
from transformers import AutoModelForImageClassification, AutoImageProcessor
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import base64
from concurrent.futures import ThreadPoolExecutor
import threading

# Initialize Flask app, SocketIO, and enable CORS
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize model and detection configurations
onnxruntime.set_default_logger_severity(3)
assets_dir = osp.expanduser('~/.insightface/models/buffalo_sc')
detector = SCRFD(os.path.join(assets_dir, 'det_500m.onnx'))
detector.prepare(0)
model_path = os.path.join(assets_dir, 'w600k_mbf.onnx')
rec = ArcFaceONNX(model_path)
rec.prepare(0)
id_to_label = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}
processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")
SIMILARITY_THRESHOLD = 0.4

# Load face database
database = {}

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

# Worker function for processing frames
def process_frame(frame, database):
    bboxes, kpss = detector.autodetect(frame, max_num=0)
    labels = []
    sims = []
    embeddings = []
    for kps in kpss:
        embedding = rec.get(frame, kps)
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

# Decode base64 image
def decode_image(encoded_image):
    header, encoded = encoded_image.split(",", 1)
    image_data = base64.b64decode(encoded)
    nparr = np.frombuffer(image_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# Emotion detection function
def detect_emotion(image):
    color_converted = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(color_converted)
    inputs = processor(images=pil_image, return_tensors="pt")
    outputs = emotion_model(**inputs)
    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
    top_prob, top_class_id = probabilities.topk(1, dim=-1)
    predicted_label = id_to_label[top_class_id.item()]
    predicted_probability = top_prob.item()
    return predicted_label, predicted_probability

# Main WebSocket handler
@socketio.on('send_frame')
def handle_frame(data):
    try:
        image = decode_image(data["image"])

        # Process frame in a separate thread
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(process_frame, image, database)
            bboxes, labels, sims = future.result()

        emotions = []
        for bbox, label, sim in zip(bboxes, labels, sims):
            x1, y1, x2, y2 = map(int, bbox[:4])
            face = image[y1:y2, x1:x2]  # Crop the face from the original image
            if face.size == 0:
                continue
            emotion_label, emotion_probability = detect_emotion(face)
            emotions.append((emotion_label, emotion_probability))

        response_data = {
            'bboxes': [bbox.tolist() for bbox in bboxes],  # Convert bounding boxes to lists
            'labels': labels,
            'emotions': [(emotion_label, float(emotion_probability)) for emotion_label, emotion_probability in emotions],  # Include processed emotions
            'sims': [float(sim) for sim in sims]  # Convert similarities to Python floats
        }
        emit('frame_response', response_data)

    except Exception as e:
        print("Error handling frame:", e)

# Route for the main page
@app.route('/')
def index():
    return "Backend is running. Connect via the SocketIO client."

if __name__ == '__main__':
    # Load face database
    database = create_face_database(rec, detector, '../face-images/')

    # Start the WebSocket server
    eventlet.wsgi.server(eventlet.listen(('10.15.95.232', 5002)), app)

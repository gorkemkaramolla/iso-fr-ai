import asyncio
from flask import Flask, Response
import zmq
import base64
import numpy as np
import cv2
import os
import os.path as osp
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
from PIL import Image
import onnxruntime

# Initialize Flask app
app = Flask(__name__)
onnxruntime.set_default_logger_severity(3)
# ZeroMQ Context
context = zmq.Context()
footage_socket = context.socket(zmq.SUB)
footage_socket.connect('tcp://10.15.95.233:5555')
footage_socket.setsockopt_string(zmq.SUBSCRIBE, str(''))

# Initialize face and emotion recognition models
assets_dir = os.path.expanduser('~/.insightface/models/buffalo_sc')
detector = SCRFD(os.path.join(assets_dir, 'det_500m.onnx'))
detector.prepare(-1)
model_path = os.path.join(assets_dir, 'w600k_mbf.onnx')
rec = ArcFaceONNX(model_path)
rec.prepare(-1)
processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")

SIMILARITY_THRESHOLD = 0.4  # Set this to your preferred threshold
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

id_to_label = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}

database = create_face_database(rec, detector, '../face-images/')
def recog_face(image, database):
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

def detect_emotion(image):
    color_converted = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(color_converted)
    inputs = processor(images=pil_image, return_tensors="pt")
    outputs = emotion_model(**inputs)
    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
    top_prob, top_class_id = probabilities.topk(1, dim=-1)
    predicted_label = id_to_label[int(top_class_id.item())]  # Convert top_class_id to an integer
    predicted_probability = top_prob.item()
    return predicted_label, predicted_probability


def decode_image(encoded_image):
    # Assuming the input is directly the base64 string without the need to split header.
    image_data = base64.b64decode(encoded_image)
    nparr = np.frombuffer(image_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def streamer():
    frame = footage_socket.recv_string()
    # Decode the image
    image = decode_image(frame)
    bboxes, labels, sims = recog_face(image, database)
    
    for bbox, label, sim in zip(bboxes, labels, sims):
        x1, y1, x2, y2 = map(int, bbox[:4])
        face = image[y1:y2, x1:x2]
        if face.size == 0:
            continue
        
        # Detect emotion    
        emotion_label, emotion_probability = detect_emotion(face)
        
        # Draw rectangle around face
        cv2.rectangle(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
        
        # Prepare text for label and emotion
        text_label = f"{label} ({sim * 100:.2f}%)"
        text_emotion = f"{emotion_label} ({emotion_probability * 100:.2f}%)"

       
        # Put text label on image {text_emotion}
        cv2.putText(image, f"{text_label} {text_emotion}", (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 1)
        
        # Encode the modified image to send back
        source = cv2.imencode('.jpg', image)[1].tobytes()
        return source

# Your existing model setup and routes (omitted for brevity)


@app.route('/')
def index():
    # Define a function as a response generator
    def generate():
        while True:
            frame = streamer()  # Get the processed frame
            if frame is not None:
                yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run( port=5000, threaded=True)

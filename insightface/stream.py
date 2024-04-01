# from flask import Flask, Response
# import cv2
# import numpy as np
# import os
# import torch
# import os.path as osp
# import onnxruntime
# from scrfd import SCRFD
# from arcface_onnx import ArcFaceONNX
# from PIL import Image
# from transformers import AutoModelForImageClassification, AutoImageProcessor

# app = Flask(__name__)

# onnxruntime.set_default_logger_severity(3)

# assets_dir = osp.expanduser('~/.insightface/models/buffalo_sc')
# detector = SCRFD(os.path.join(assets_dir, 'det_500m.onnx'))
# detector.prepare(0)
# model_path = os.path.join(assets_dir, 'w600k_mbf.onnx')
# rec = ArcFaceONNX(model_path)
# rec.prepare(0)

# id_to_label = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}

# # processor = AutoImageProcessor.from_pretrained("dima806/facial_emotions_image_detection")
# # emotion_model = AutoModelForImageClassification.from_pretrained("dima806/facial_emotions_image_detection")
# processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
# emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")

# SIMILARITY_THRESHOLD = 0.4  # Set this to your preferred threshold

# def create_face_database(model, face_detector, image_folder):
#     database = {}
#     for filename in os.listdir(image_folder):
#         if filename.endswith((".jpg", ".png")):
#             name = osp.splitext(filename)[0]
#             image_path = osp.join(image_folder, filename)
#             image = cv2.imread(image_path)
#             bboxes, kpss = face_detector.autodetect(image, max_num=1)
#             if bboxes.shape[0] > 0:
#                 kps = kpss[0]
#                 embedding = model.get(image, kps)
#                 database[name] = embedding
#     return database

# def func(image, database):
#     bboxes, kpss = detector.autodetect(image, max_num=0)
#     labels = []
#     sims = []
#     embeddings = []
#     for kps in kpss:
#         embedding = rec.get(image, kps)
#         embeddings.append(embedding)
#     for embedding in embeddings:
#         min_dist = float('inf')
#         best_match = None
#         for name, db_embedding in database.items():
#             dist = np.linalg.norm(db_embedding - embedding)
#             if dist < min_dist:
#                 min_dist = dist
#                 best_match = name
#         sim = rec.compute_sim(embedding, database[best_match])
#         labels.append(best_match if sim >= SIMILARITY_THRESHOLD else "Unknown")
#         sims.append(sim)
#     return bboxes, labels, sims

# def detect_emotion(image):
#     color_converted = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
#     pil_image = Image.fromarray(color_converted)
#     inputs = processor(images=pil_image, return_tensors="pt")
#     outputs = emotion_model(**inputs)
#     probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
#     top_prob, top_class_id = probabilities.topk(1, dim=-1)
#     predicted_label = id_to_label[top_class_id.item()]
#     predicted_probability = top_prob.item()
#     return predicted_label, predicted_probability

# def gen_frames():
#     cap = cv2.VideoCapture(0)  # Get the camera

#     # Set the video capture size
#     cap.set(3, 640)  # Set the width to 320 pixels
#     cap.set(4, 480)  # Set the height to 240 pixels

#     database = create_face_database(rec, detector, '../face-images/')

#     try:
#         while True:
#             success, frame = cap.read()
#             if not success:
#                 break
#             else:
#                 bboxes, labels, sims = func(frame, database)
#                 for bbox, label, sim in zip(bboxes, labels, sims):
#                     x1, y1, x2, y2 = map(int, bbox[:4])
#                     face = frame[y1:y2, x1:x2]
#                     if face.size == 0:
#                         continue
#                     emotion_label, emotion_probability = detect_emotion(face)
#                     if sim < SIMILARITY_THRESHOLD or label == "Unknown":
#                         cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 1)  # thinner rectangle
                        
#                         label_with_similarity = f"Unknown ({emotion_label}: {emotion_probability*100:.1f}%)"
                        
#                     else:
#                         label_with_similarity = f"{label} ({sim:.2f}%)"
#                         cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)  # thinner rectangle
                        
#                     cv2.putText(frame, label_with_similarity, (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)  # Below the face
#                     cv2.putText(frame, f"{emotion_label}: {emotion_probability*100:.1f}%", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)  # Above the face
#                 ret, buffer = cv2.imencode('.jpg', frame)
#                 frame_encoded = buffer.tobytes()
#                 yield (b'--frame\r\n'
#                        b'Content-Type: image/jpeg\r\n\r\n' + frame_encoded + b'\r\n')
#     finally:
#         cap.release()

# @app.route('/video_feed')
# def video_feed():
#     return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5002)
# main.py
import eventlet
import eventlet.wsgi
from flask import Flask, render_template
import cv2
import torch
import ssl
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
from io import BytesIO

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

app = Flask(__name__)
CORS(app,  origins=["wss://localhost:3000", "wss://localhost:3000",
                    "http://localhost:3000", "https://localhost:3000", 
                    "https://10.15.95.233:3000", "https://10.15.95.232:3000", 
                    "wss://10.15.95.233:3000", "wss://10.15.95.232:3000"])
socketio = SocketIO(app, cors_allowed_origins="*")


# Model and detection configurations
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


# Assuming this database is populated elsewhere in your code
database = {}

@app.route('/')
def index():
    return "Backend is running. Connect via the SocketIO client."

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


database = create_face_database(rec, detector, '../face-images/')

def decode_image(encoded_image):
    header, encoded = encoded_image.split(",", 1)
    image_data = base64.b64decode(encoded)
    nparr = np.frombuffer(image_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

@socketio.on('send_frame')
def handle_frame(data):
    
    try:
        image = decode_image(data["image"])
        # image_data = data['image'].split(",")[1]
        # image_bytes = base64.b64decode(image_data)
        # image = np.array(Image.open(BytesIO(image_bytes)))
        # frame = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        bboxes, labels, sims = func(image, database)
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


if __name__ == '__main__':
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    key_path = os.path.expanduser('../cert/localhost/localhost.decrypted.key')  # Adjust if your certificate is in a different location
    cert_path = os.path.expanduser('../cert/localhost/localhost.crt')   # Adjust if your key is in a different location
    ssl_context.load_cert_chain(cert_path, key_path)
    eventlet.wsgi.server(eventlet.wrap_ssl(eventlet.listen(('10.15.95.232', 5002)),
                       certfile=cert_path,
                       keyfile=key_path,
                       server_side=True), app)
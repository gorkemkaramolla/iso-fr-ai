from flask import Flask, Response, request
import cv2
import numpy as np
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

# Initialize face recognition models
assets_dir = os.path.expanduser('~/.insightface/models/buffalo_sc')
detector = SCRFD(os.path.join(assets_dir, 'det_500m.onnx'))
detector.prepare(-1)
model_path = os.path.join(assets_dir, 'w600k_mbf.onnx')
rec = ArcFaceONNX(model_path)
rec.prepare(-1)
processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")

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

SIMILARITY_THRESHOLD = 0.4
database = create_face_database(rec, detector, '../face-images/')
id_to_label = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}

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

# @app.route('/')
# def index():
#     # Access the 'quality' parameter within the request context
#     quality = request.args.get('quality', 'Quality')
#     base_rtsp_url = 'rtsp://root:N143g144@192.168.100.152/axis-media/media.amp?'
#     rtsp_url = f"{base_rtsp_url}videocodec=h264&streamprofile={quality}"

    # def generate():
    #     cap = cv2.VideoCapture(rtsp_url)
    #     if not cap.isOpened():
    #         print("Error opening RTSP stream")
    #         return
    #     while True:
    #         ret, frame = cap.read()
    #         if not ret:
    #             break
    #         bboxes, labels, sims = recog_face(frame, database)
    #         for bbox, label, sim in zip(bboxes, labels, sims):
    #             x1, y1, x2, y2 = map(int, bbox[:4])
    #             face = frame[y1:y2, x1:x2]
    #             if face.size == 0:
    #                 continue
    #             cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
    #             text_label = f"{label} ({sim * 100:.2f}%)"
    #             cv2.putText(frame, text_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 1)
    #         _, buffer = cv2.imencode('.jpg', frame)
    #         yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    #     cap.release()
#     return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stream1')
def stream1():
    camera = request.args.get('camera', "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality")
   
    def generate():
        cap = cv2.VideoCapture(camera)
        if not cap.isOpened():
            print("Error opening RTSP stream")
            return
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            bboxes, labels, sims = recog_face(frame, database)
            for bbox, label, sim in zip(bboxes, labels, sims):
                x1, y1, x2, y2 = map(int, bbox[:4])
                face = frame[y1:y2, x1:x2]
                if face.size == 0:
                    continue
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 4)
                text_label = f"{label} ({sim * 100:.2f}%)"
                cv2.putText(frame, text_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 0, 0), 4)
            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        cap.release()

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stream2')
def stream2():
    camera = request.args.get('camera', "http://localhost:5555")

    def generate():
        cap = cv2.VideoCapture(camera)
        if not cap.isOpened():
            print("Error opening RTSP stream")
            return
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            bboxes, labels, sims = recog_face(frame, database)
            for bbox, label, sim in zip(bboxes, labels, sims):
                x1, y1, x2, y2 = map(int, bbox[:4])
                face = frame[y1:y2, x1:x2]
                if face.size == 0:
                    continue
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 4)
                text_label = f"{label} ({sim * 100:.2f}%)"
                cv2.putText(frame, text_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 0, 0), 4)
            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        cap.release()

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(port=5002, threaded=True, debug=True)

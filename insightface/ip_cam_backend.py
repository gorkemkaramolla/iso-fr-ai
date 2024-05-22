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
from enums import Camera
from flask_cors import CORS
import threading
import queue
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType


# Initialize Flask app
app = Flask(__name__)
CORS(app)

onnxruntime.set_default_logger_severity(2)

device = onnxruntime.get_device()
is_cuda_available = torch.cuda.is_available()
providers = ['CUDAExecutionProvider'] if device == 'GPU' and is_cuda_available else ['CPUExecutionProvider']
print(f"Device: {device}")
print(f"Is CUDA avaliable: {is_cuda_available}")
def set_session(model_path, providers):
    session = onnxruntime.InferenceSession(model_path, providers=providers)
    return session
# Initialize face recognition models
# assets_dir = os.path.expanduser('~/.insightface/models/buffalo_sc')
# detector = SCRFD(os.path.join(assets_dir, 'det_500m.onnx'))
# detector.prepare(-1)
# model_path = os.path.join(assets_dir, 'w600k_mbf.onnx')
# rec = ArcFaceONNX(model_path)
# rec.prepare(-1)

#Large model görkem
assets_dir = os.path.expanduser('~/.insightface/models/buffalo_l')

# Initialize the SCRFD detector with the model file
det_10g_model_path =os.path.join(assets_dir, 'det_10g.onnx')
detector = SCRFD(model_file=det_10g_model_path, session=set_session(det_10g_model_path, providers))
detector.prepare(-1)

# Initialize the ArcFace recognizer with the model file
w600k_r50_model_path = os.path.join(assets_dir, 'w600k_r50.onnx')
rec = ArcFaceONNX(model_file=w600k_r50_model_path, session=set_session(w600k_r50_model_path, providers))
rec.prepare(-1)
# processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
# emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")

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

def _generate_response_frame(camera: Camera):
    cap = cv2.VideoCapture(camera)
    if not cap.isOpened():
        print("Error opening HTTP stream")
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

# Camera Response Stream
@app.route('/stream/<int:stream_id>')
def ip_camera_stream(stream_id):
    camera_label = request.args.get('camera')
    quality = request.args.get('quality', 'Quality')
    camera = Camera[camera_label].value + quality

    return Response(_generate_response_frame(camera), mimetype='multipart/x-mixed-replace; boundary=frame')

# Open Client Camera
@app.route('/camera/<int:cam_id>')
def local_camera_stream(cam_id):
    # camera_label = request.args.get('camera')
    # print(camera_label)
    # print(cam_id)
    # Return a multipart HTTP response with the generated frames
    return Response(_open_local_camera(cam_id), mimetype='multipart/x-mixed-replace; boundary=frame')

def _open_local_camera(cam_id):
    # OpenCV capture from camera
    print("----------- capture_id: " + str(cam_id) + "-----------")
    cap = cv2.VideoCapture(cam_id)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Encode the frame to JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue

        # Yield the encoded frame
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    # Release the capture when done
    cap.release()

if __name__ == '__main__':
    app.run(port=5000, threaded=True, debug=True)

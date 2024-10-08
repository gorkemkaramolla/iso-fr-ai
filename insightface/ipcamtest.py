import cv2
import os
# import torch  # Commented as it is required for ViT model
import numpy as np
import onnxruntime
from PIL import Image
import os.path as osp
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX
# from transformers import AutoModelForImageClassification, AutoImageProcessor  # Commented as it is not used

# device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')  # Commented as it is required for ViT model

# id_to_label = {0: 'sad', 1: 'disgust', 2: 'angry', 3: 'neutral', 4: 'fear', 5: 'surprise', 6: 'happy'}  # Commented as it belongs to ViT model

# processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")  # Commented as it is not used
# model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")  # Commented as it is not used

onnxruntime.set_default_logger_severity(3)

assets_dir = osp.expanduser('~/.insightface/models/buffalo_sc')
detector = SCRFD(os.path.join(assets_dir, 'det_500m.onnx'))
detector.prepare(0)
model_path = os.path.join(assets_dir, 'w600k_mbf.onnx')
rec = ArcFaceONNX(model_path)
rec.prepare(0)

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

def main(image_folder):
    database = create_face_database(rec, detector, image_folder)
    cap = cv2.VideoCapture("http://root:N143g144@192.168.100.152/mjpg/video.mjpg")


    while True:
        ret, frame = cap.read()
        bboxes, labels, sims = func(frame, database)
        for bbox, label, sim in zip(bboxes, labels, sims):
            x1, y1, x2, y2 = map(int, bbox[:4])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            # Additional info like face recognition result can be displayed using cv2.putText
            cv2.putText(frame, f'{label} ({sim:.2f})', (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main('../face-images/')

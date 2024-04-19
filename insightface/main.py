import cv2
import os
import torch
import numpy as np
import onnxruntime
from PIL import Image
import os.path as osp
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX
from transformers import AutoModelForImageClassification, AutoImageProcessor

id_to_label = {0: 'sad', 1: 'disgust', 2: 'angry', 3: 'neutral', 4: 'fear', 5: 'surprise', 6: 'happy'}

processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")


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
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        bboxes, labels, sims = func(frame, database)
        for bbox, label, sim in zip(bboxes, labels, sims):
            x1, y1, x2, y2 = map(int, bbox[:4])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            face = frame[y1:y2, x1:x2]
            if face.size == 0:
                continue
            color_converted = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(color_converted)
            inputs = processor(images=pil_image, return_tensors="pt")
            outputs = model(**inputs)
            probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
            top_prob, top_class_id = probabilities.topk(1, dim=-1)
            predicted_label = id_to_label[top_class_id.item()]
            predicted_probability = top_prob.item()
            if sim < SIMILARITY_THRESHOLD or label == "Unknown":
                label_with_sim = f"Unknown ({predicted_label}: {predicted_probability:.2%})"
                cv2.putText(frame, label_with_sim, (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            else:
                label_with_sim = f"{label} ({sim:.2f}, {predicted_label}: {predicted_probability:.2%})"
                cv2.putText(frame, label_with_sim, (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        cv2.imshow('frame', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main('../face-images/')

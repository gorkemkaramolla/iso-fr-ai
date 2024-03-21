import cv2
import os
import os.path as osp
import numpy as np
import onnxruntime
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX


# Assume SCRFD and ArcFaceONNX class definitions are included here

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
        if filename.endswith(".jpg") or filename.endswith(".png"):
            name = osp.splitext(filename)[0]
            image_path = osp.join(image_folder, filename)
            image = cv2.imread(image_path)
            bboxes, kpss = face_detector.autodetect(image, max_num=1)
            if bboxes.shape[0] > 0:
                kps = kpss[0]
                embedding = model.get(image, kps)
                database[name] = embedding
    return database

def find_best_match(database, embedding):
    min_dist = float('inf')
    best_match = None
    for name, db_embedding in database.items():
        dist = np.linalg.norm(db_embedding - embedding)
        if dist < min_dist:
            min_dist = dist
            best_match = name
    return best_match

SIMILARITY_THRESHOLD = 0.4  # Set this to your preferred threshold

def func(image, database):
    bboxes, kpss = detector.autodetect(image, max_num=0)  # Detect all faces in the image
    labels = []
    sims = []  # To store similarity scores for each detected face
    for kps in kpss:
        embedding = rec.get(image, kps)  # Get embedding for the detected face
        best_match = None
        max_sim = -1  # Initialize with a value lower than possible similarity
        for name, db_embedding in database.items():
            sim = rec.compute_sim(embedding, db_embedding)  # Compute similarity
            if sim > max_sim:
                max_sim = sim
                best_match = name if sim >= SIMILARITY_THRESHOLD else "Unknown"  # Check threshold
        labels.append(best_match if best_match else "Unknown")
        sims.append(max_sim)  # Store the highest similarity score for this face
    return bboxes, labels, sims  # Return bounding boxes, labels, and similarity scores

def draw_bounding_boxes(image, bboxes, labels):
    for bbox, label in zip(bboxes, labels):
        x1, y1, x2, y2 = map(int, bbox[:4])
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    return image
def main(image_folder):
    database = create_face_database(rec, detector, image_folder)
    cap = cv2.VideoCapture(0)

    SIMILARITY_THRESHOLD = 0.4  # Adjust this threshold as needed

    while True:
        ret, frame = cap.read()
        bboxes, labels, sims = func(frame, database)  # Detect faces and get labels and similarity scores
        for bbox, label, sim in zip(bboxes, labels, sims):
            x1, y1, x2, y2 = map(int, bbox[:4])
            # Draw bounding box for every face
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Label the bounding box
            if sim < SIMILARITY_THRESHOLD or label == "Unknown":
                # Label as "Unknown" if below threshold or already labeled as "Unknown"
                cv2.putText(frame, "Unknown", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            else:
                # Otherwise, label with the best match name and similarity score
                label_with_sim = f"{label} ({sim:.2f})"
                cv2.putText(frame, label_with_sim, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        cv2.imshow('frame', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main('../face-images/')

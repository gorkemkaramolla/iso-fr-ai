from typing import List, Tuple
import cv2
import numpy as np
import pandas as pd
import datetime
import os
import os.path as osp
from pymongo import MongoClient
from services.camera_processor.scrfd import SCRFD
from services.camera_processor.arcface_onnx import ArcFaceONNX
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
from PIL import Image
import onnxruntime
from services.camera_processor.enums.camera import Camera
import uuid
from cv2.typing import MatLike
import logging
import threading  # For handling the stop flag in a thread-safe manner
from socketio_instance import notify_new_face
from services.camera_processor.attribute import Attribute


class CameraProcessor:
    def __init__(self, device="cuda"):
        self.device = torch.device(device)
        print(f"Using device: {self.device}")
        onnxruntime.set_default_logger_severity(3)
        self.assets_dir = os.path.expanduser("~/.insightface/models/buffalo_l/")
        detector_path = os.path.join(self.assets_dir, "det_10g.onnx")
        self.detector = SCRFD(detector_path)
        self.detector.prepare(0 if device == "cuda" else -1)
        rec_path = os.path.join(self.assets_dir, "w600k_r50.onnx")
        self.rec = ArcFaceONNX(rec_path)
        self.rec.prepare(0 if device == "cuda" else -1)
        gender_age_model_path = os.path.join(self.assets_dir, "genderage.onnx")
        self.gender_age_model = Attribute(gender_age_model_path)
        self.gender_age_model.prepare(0 if device == "cuda" else -1)
        self.processor = AutoImageProcessor.from_pretrained(
            "trpakov/vit-face-expression"
        )
        self.emotion_model = AutoModelForImageClassification.from_pretrained(
            "trpakov/vit-face-expression"
        ).to(self.device)
        self.id_to_label = {
            0: "angry",
            1: "disgust",
            2: "fear",
            3: "happy",
            4: "neutral",
            5: "sad",
            6: "surprise",
        }
        self.similarity_threshold = 0.2
        self.database = self.create_face_database(
            self.rec,
            self.detector,
            os.path.join(os.getcwd(), "face-images"),
        )
        self.camera_urls_file = "camera_urls.csv"
        self.log_file = "recognized_faces_log.csv"
        self.init_log_file()
        self.last_recognitions = {}
        self.known_faces_dir = "recog/known_faces"
        if not os.path.exists(self.known_faces_dir):
            os.makedirs(self.known_faces_dir)
        self.unknown_faces_dir = "recog/unknown_faces"
        if not os.path.exists(self.unknown_faces_dir):
            os.makedirs(self.unknown_faces_dir)
        self.client = MongoClient(os.getenv("MONGO_DB_URI"))
        self.db = self.client["isoai"]
        self.recognition_logs_collection = self.db["logs"]
        self.stop_flag = threading.Event()  # Initialize the stop flag

    def init_log_file(self):
        if not os.path.exists(self.log_file):
            df = pd.DataFrame(columns=["Timestamp", "Label", "Similarity", "Emotion"])
            df.to_csv(self.log_file, index=False)

    def stop_camera(self):
        self.stop_flag.set()  # Set the stop flag to stop the camera loop

    def compare_similarity(self, image1: MatLike, image2: MatLike):
        if image1 is None or image2 is None:
            return -1.0, "One or both images are None"
        if len(image1.shape) < 2 or len(image2.shape) < 2:
            return -1.0, "One or both images are not valid"
        bboxes1, kpss1 = self.detector.detect(
            image1, max_num=1, input_size=(128, 128), thresh=0.5, metric="max"
        )
        if len(bboxes1) == 0 or bboxes1.shape[0] == 0:
            return -1.0, "Face not found in Image-1"
        bboxes2, kpss2 = self.detector.detect(
            image2, max_num=1, input_size=(128, 128), thresh=0.5, metric="max"
        )
        if len(bboxes2) == 0 or bboxes2.shape[0] == 0:
            return -1.0, "Face not found in Image-2"
        kps1 = kpss1[0]
        kps2 = kpss2[0]
        feat1 = self.rec.get(image1, kps1)
        feat2 = self.rec.get(image2, kps2)
        sim = self.rec.compute_sim(feat1, feat2)
        if sim < 0.2:
            conclu = "They are NOT the same person"
        elif sim >= 0.2 and sim < 0.28:
            conclu = "They are LIKELY TO be the same person"
        else:
            conclu = "They ARE the same person"
        return sim, conclu

    def read_camera_urls(self):
        if not os.path.exists(self.camera_urls_file):
            return {}
        df = pd.read_csv(self.camera_urls_file, index_col=0)
        return df.to_dict()["url"]

    def write_camera_urls(self, camera_urls):
        df = pd.DataFrame(list(camera_urls.items()), columns=["label", "url"])
        df.to_csv(self.camera_urls_file, index=False)

    def create_face_database(self, model, face_detector, image_folder):
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

    def get_emotion(self, face_image):
        pil_image = Image.fromarray(face_image)
        processed_image = self.processor(pil_image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.emotion_model(**processed_image)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class = predictions.argmax().item()
            emotion = self.id_to_label[predicted_class]
        return emotion

    def save_and_log_face(self, face_image, label, similarity, emotion, is_known):
        if face_image is None:
            print("Error: The face image is empty and cannot be saved.")
            return "Error: Empty face image"
        now = datetime.datetime.now()
        timestamp = int(now.timestamp() * 1000)
        if label in self.last_recognitions:
            last_recognition_time = self.last_recognitions[label]
            time_diff = (now - last_recognition_time).total_seconds()
            if time_diff < 60:
                return
        self.last_recognitions[label] = now
        filename_timestamp = now.strftime("%Y%m%d-%H%M%S")
        filename = f"{label}-{filename_timestamp}.jpg"
        base_dir = self.known_faces_dir if is_known else self.unknown_faces_dir
        person_dir = os.path.join(base_dir, label)
        os.makedirs(person_dir, exist_ok=True)
        file_path = os.path.join(person_dir, filename)
        print(f"Saving face image to: {file_path}")
        try:
            success = cv2.imwrite(file_path, face_image)
            if not success:
                print("Error: Failed to save the image.")
                return "Error: Failed to save image"
        except cv2.error as e:
            print(f"OpenCV error: {e}")
            return f"Error: OpenCV error - {e}"
        except PermissionError as e:
            print(f"Permission error: {e}")
            return f"Error: Permission error - {e}"
        except FileNotFoundError as e:
            print(f"File not found error: {e}")
            return f"Error: File not found error - {e}"
        except Exception as e:
            print(f"Unexpected error: {e}")
            return f"Error: Unexpected error - {e}"
        log_record = {
            "timestamp": timestamp,
            "label": label,
            "similarity": round(float(similarity), 2),
            "emotion": emotion,
            "image_path": file_path,
        }
        notify_new_face(log_record)
        self.recognition_logs_collection.insert_one(log_record)

        return file_path

    def recog_face_and_emotion(
        self, image: np.ndarray
    ) -> Tuple[
        List[np.ndarray], List[str], List[float], List[str], List[int], List[str]
    ]:
        if image is None or len(image.shape) < 2:
            return [], [], [], [], [], []

        bboxes, kpss = self.detector.autodetect(image, max_num=49)
        if len(bboxes) == 0:
            return [], [], [], [], [], []

        labels = []
        sims = []
        emotions = []
        embeddings = []
        ages = []
        genders = []

        for kps in kpss:
            embedding = self.rec.get(image, kps)
            embeddings.append(embedding)

        for idx, embedding in enumerate(embeddings):
            min_dist = float("inf")
            best_match = None
            label = "Bilinmeyen"
            is_known = False

            for name, db_embedding in self.database.items():
                dist = np.linalg.norm(db_embedding - embedding)
                if dist < min_dist:
                    min_dist = dist
                    best_match = name

            sim = self.rec.compute_sim(
                embedding, self.database.get(best_match, np.zeros_like(embedding))
            )
            if sim >= self.similarity_threshold:
                label = best_match
                is_known = True

            bbox = bboxes[idx]
            x1, y1, x2, y2 = map(int, bbox[:4])
            face_image = image[y1:y2, x1:x2]

            if not is_known:
                label = f"x-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
                self.database[label] = embedding

            labels.append(label)
            sims.append(sim)

            # Predict age and gender
            # face = {"bbox": bbox}
            gender, age = self.gender_age_model.get(image, face=bbox)
            ages.append(age)
            genders.append("M" if gender == 1 else "F")

            emotion = self.get_emotion(face_image)
            emotions.append(emotion)

            self.save_and_log_face(face_image, label, sim, emotion, is_known)

        return bboxes, labels, sims, emotions, genders, ages

    # def recog_face_and_emotion(self, image: MatLike):
    #     if image is None or len(image.shape) < 2:
    #         return [], [], [], []
    #     bboxes, kpss = self.detector.autodetect(image, max_num=49)
    #     if len(bboxes) == 0:
    #         return [], [], [], []
    #     labels = []
    #     sims = []
    #     emotions = []
    #     embeddings = []
    #     for kps in kpss:
    #         embedding = self.rec.get(image, kps)
    #         embeddings.append(embedding)
    #     for idx, embedding in enumerate(embeddings):
    #         min_dist = float("inf")
    #         best_match = None
    #         label = "Bilinmeyen"
    #         is_known = False
    #         for name, db_embedding in self.database.items():
    #             dist = np.linalg.norm(db_embedding - embedding)
    #             if dist < min_dist:
    #                 min_dist = dist
    #                 best_match = name
    #         sim = self.rec.compute_sim(embedding, self.database[best_match])
    #         if sim >= self.similarity_threshold:
    #             label = best_match
    #             is_known = True
    #         bbox = bboxes[idx]
    #         x1, y1, x2, y2 = map(int, bbox[:4])
    #         face_image = image[y1:y2, x1:x2]
    #         if not is_known:
    #             label = f"x-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
    #             self.database[label] = embedding
    #         labels.append(label)
    #         sims.append(sim)
    #         bbox = bboxes[idx]
    #         x1, y1, x2, y2 = map(int, bbox[:4])
    #         face = image[y1:y2, x1:x2]
    #         emotion = self.get_emotion(face)
    #         emotions.append(emotion)
    #         self.save_and_log_face(face_image, label, sim, emotion, is_known)
    #     return bboxes, labels, sims, emotions

    def generate(self, stream_id, camera, quality="Quality", is_recording=False):
        self.stop_flag.clear()  # Clear the stop flag at the beginning
        logging.info(f"Opening camera stream: {camera}")
        try:
            camera_int = int(camera)
            cap = cv2.VideoCapture(camera_int)
        except ValueError:
            cap = cv2.VideoCapture(camera + quality)
        print("Camera Opened:  " + str(cap.isOpened()))
        writer = None
        if is_recording:
            now = datetime.datetime.now()
            directory = "./records/"
            if not os.path.exists(directory):
                os.makedirs(directory)
            filename = directory + now.strftime("%H:%M:%S_%d.%m.%Y") + ".mp4"
        while not self.stop_flag.is_set():
            ret, frame = cap.read()
            if not ret:
                logging.error("Error reading frame")
                break
            if is_recording and writer is None:
                frame_height, frame_width = frame.shape[:2]
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(
                    filename, fourcc, 20.0, (frame_width, frame_height)
                )
                if not writer.isOpened():
                    logging.error("Error initializing video writer")
                    break
            bboxes, labels, sims, emotions, genders, ages = self.recog_face_and_emotion(
                frame
            )
            for bbox, label, sim, emotion, gender, age in zip(
                bboxes, labels, sims, emotions, genders, ages
            ):
                x1, y1, x2, y2 = map(int, bbox[:4])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)
                text_label = f"{label} ({sim * 100:.2f}%): {emotion}, gender: {gender}, age: {age}"
                cv2.putText(
                    frame,
                    text_label,
                    (x1 + 5, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2,
                )
            if writer:
                writer.write(frame)
            _, buffer = cv2.imencode(".jpg", frame)
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            )
        cap.release()
        if writer:
            writer.release()
        logging.info("Finished generate function")

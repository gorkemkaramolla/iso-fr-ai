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
import uuid
from cv2.typing import MatLike
import logging
import threading  # For handling the stop flag in a thread-safe manner
import base64

class CameraProcessor:
    def __init__(self, device="cuda"):
        self.device = torch.device(device)
        print(f"Using device: {self.device}")
        onnxruntime.set_default_logger_severity(3)
        self.assets_dir = os.path.expanduser("~/.insightface/models/")
        detector_path = os.path.join(self.assets_dir, "buffalo_sc/det_500m.onnx")
        self.detector = SCRFD(detector_path)
        self.detector.prepare(0 if device == "cuda" else -1)
        rec_path = os.path.join(self.assets_dir, "buffalo_sc/w600k_mbf.onnx")
        self.rec = ArcFaceONNX(rec_path)
        self.rec.prepare(0 if device == "cuda" else -1)
        self.processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
        self.emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression").to(self.device)
        self.id_to_label = {0: "angry", 1: "disgust", 2: "fear", 3: "happy", 4: "neutral", 5: "sad", 6: "surprise"}
        self.similarity_threshold = 0.2

        # Initialize MongoDB client
        self.client = MongoClient("mongodb://localhost:27017/")
        self.db = self.client["isoai"]
        self.detection_logs_collection = self.db["detection_logs"]

        self.database = self.create_face_database()

        self.camera_urls_file = "camera_urls.csv"
        self.log_file = "recognized_faces_log.csv"
        self.init_log_file()
        self.last_recognitions = {}
        self.current_recognitions = {}
        self.exiting_recognitions = {}
        self.known_faces_dir = "recog/known_faces"
        if not os.path.exists(self.known_faces_dir):
            os.makedirs(self.known_faces_dir)
        self.stop_flag = threading.Event()  # Initialize the stop flag
        self.exit_buffer_time = 30  # Buffer time in seconds

    def init_log_file(self):
        if not os.path.exists(self.log_file):
            df = pd.DataFrame(columns=["Status", "Label", "Timestamp", "Emotion"])
            df.to_csv(self.log_file, index=False)

    def stop_camera(self):
        self.stop_flag.set()  # Set the stop flag to stop the camera loop

    def compare_similarity(self, image1: MatLike, image2: MatLike):
        if image1 is None or image2 is None:
            return -1.0, "One or both images are None"
        if len(image1.shape) < 2 or len(image2.shape) < 2:
            return -1.0, "One or both images are not valid"
        bboxes1, kpss1 = self.detector.detect(image1, max_num=1, input_size=(128, 128), thresh=0.5, metric="max")
        if len(bboxes1) == 0 or bboxes1.shape[0] == 0:
            return -1.0, "Face not found in Image-1"
        bboxes2, kpss2 = self.detector.detect(image2, max_num=1, input_size=(128, 128), thresh=0.5, metric="max")
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

    def create_face_database(self):
        database = {}
        person_collection = self.db['Person']

        for person in person_collection.find():
            image_path = person.get('image_path')

            if image_path and image_path.endswith((".jpg", ".png")):
                name = f"{person.get('first_name')}{person.get('last_name')}"
                # Adjust the path to point to the correct image location one level up
                full_image_path = os.path.join(os.path.dirname(os.getcwd()), image_path.lstrip('/'))
                print(f"Reading image from: {full_image_path}")
                image = cv2.imread(full_image_path)
                if image is None:
                    print(f"Warning: Could not read image at {full_image_path}")
                    continue
                bboxes, kpss = self.detector.autodetect(image, max_num=1)
                if bboxes.shape[0] > 0:
                    kps = kpss[0]
                    embedding = self.rec.get(image, kps)
                    database[name] = {
                        "embedding": embedding,
                        "person_id": person["_id"]
                    }
                else:
                    print(f"Warning: No face detected in image at {full_image_path}")
            else:
                print(f"Warning: Invalid or missing image path for person {person.get('first_name')} {person.get('last_name')}")
        
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

    def log_recognition(self, status, label, emotion, face_image):
        if label == "Bilinmeyen":
            return

        now = datetime.datetime.now()
        timestamp = now.strftime("%d/%m/%Y %H:%M:%S")

        # Save image to filesystem
        filename_timestamp = now.strftime("%Y%m%d-%H%M%S")
        filename = f"{label}-{filename_timestamp}.jpg"
        base_dir = self.known_faces_dir
        person_dir = os.path.join(base_dir, label)
        os.makedirs(person_dir, exist_ok=True)
        file_path = os.path.join(person_dir, filename)
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

        # Save image to MongoDB
        _, image_encoded = cv2.imencode('.jpg', face_image)
        image_bytes = image_encoded.tobytes()

        if status == "Entered":
            person_id = self.database[label]["person_id"] if label in self.database else None
            log_record = {
                "status": status,
                "label": label,
                "time_entered": timestamp,
                "time_quited": "",
                "emotion_entered": emotion,
                "emotion_quited": "",
                "image_entered": image_bytes,
                "image_quited": None,
                "person_id": person_id
            }
            self.detection_logs_collection.insert_one(log_record)
        elif status == "Quited":
            # Find the last "Entered" record for this label
            last_entry = self.detection_logs_collection.find_one(
                {"label": label, "status": "Entered"},
                sort=[("time_entered", -1)]
            )

            if last_entry:
                self.detection_logs_collection.update_one(
                    {"_id": last_entry["_id"]},
                    {"$set": {
                        "status": status,
                        "time_quited": timestamp,
                        "emotion_quited": emotion,
                        "image_quited": image_bytes
                    }}
                )

        return file_path

    def recog_face_and_emotion(self, image: MatLike):
        if image is None or len(image.shape) < 2:
            return [], [], [], []

        bboxes, kpss = self.detector.autodetect(image, max_num=49)
        if len(bboxes) == 0:
            current_time = datetime.datetime.now()
            for label in list(self.current_recognitions):
                if label not in self.exiting_recognitions:
                    self.exiting_recognitions[label] = current_time
                elif (current_time - self.exiting_recognitions[label]).total_seconds() > self.exit_buffer_time:
                    if label != "Bilinmeyen":
                        emotion = "unknown"
                        face_image = np.zeros((100, 100, 3), dtype=np.uint8)  # Placeholder image
                        self.log_recognition("Quited", label, emotion, face_image)
                    del self.current_recognitions[label]
                    del self.exiting_recognitions[label]
            return [], [], [], []

        labels = []
        sims = []
        emotions = []
        embeddings = []
        current_labels = set()

        # Get embeddings for detected faces
        for kps in kpss:
            embedding = self.rec.get(image, kps)
            embeddings.append(embedding)

        # Process each detected face
        for idx, embedding in enumerate(embeddings):
            min_dist = float("inf")
            best_match = None
            label = "Bilinmeyen"

            for name, data in self.database.items():
                db_embedding = data["embedding"]
                dist = np.linalg.norm(db_embedding - embedding)
                if dist < min_dist:
                    min_dist = dist
                    best_match = name

            sim = self.rec.compute_sim(embedding, self.database[best_match]["embedding"])
            if sim >= self.similarity_threshold:
                label = best_match

            bbox = bboxes[idx]
            x1, y1, x2, y2 = map(int, bbox[:4])
            face_image = image[y1:y2, x1:x2]

            labels.append(label)
            sims.append(sim)
            emotion = self.get_emotion(face_image)
            emotions.append(emotion)

            current_labels.add(label)
            if label not in self.current_recognitions:
                self.log_recognition("Entered", label, emotion, face_image)
            self.current_recognitions[label] = datetime.datetime.now()

        # Handle exiting recognitions
        exiting_labels = set(self.current_recognitions.keys()) - current_labels
        for label in exiting_labels:
            if label not in self.exiting_recognitions:
                self.exiting_recognitions[label] = datetime.datetime.now()
            elif (datetime.datetime.now() - self.exiting_recognitions[label]).total_seconds() > self.exit_buffer_time:
                if label != "Bilinmeyen":
                    face_image = np.zeros((100, 100, 3), dtype=np.uint8)  # Placeholder for the image, replace with actual face image if available
                    emotion = "unknown"  # Placeholder for the emotion, replace with actual emotion if available
                    self.log_recognition("Quited", label, emotion, face_image)
                del self.current_recognitions[label]
                del self.exiting_recognitions[label]

        # Reset exiting recognitions if the label is detected again
        for label in current_labels:
            if label in self.exiting_recognitions:
                del self.exiting_recognitions[label]

        return bboxes, labels, sims, emotions

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
                writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))
                if not writer.isOpened():
                    logging.error("Error initializing video writer")
                    break
            bboxes, labels, sims, emotions = self.recog_face_and_emotion(frame)
            for bbox, label, sim, emotion in zip(bboxes, labels, sims, emotions):
                x1, y1, x2, y2 = map(int, bbox[:4])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)
                text_label = f"{label} ({sim * 100:.2f}%): {emotion}"
                cv2.putText(frame, text_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            if writer:
                writer.write(frame)
            _, buffer = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
        cap.release()
        if writer:
            writer.release()
        logging.info("Finished generate function")

    def get_detected_faces(self):
        collection = self.db['detection_logs']
        documents = collection.find({})

        log_data = []
        for doc in documents:
            image_entered = base64.b64encode(doc['image_entered']).decode('utf-8') if isinstance(doc['image_entered'], bytes) else None
            image_quited = base64.b64encode(doc['image_quited']).decode('utf-8') if 'image_quited' in doc and isinstance(doc['image_quited'], bytes) else None

            log_data.append({
                "status": doc.get("status", ""),
                "label": doc.get("label", ""),
                "time_entered": doc.get("time_entered", ""),
                "time_quited": doc.get("time_quited", ""),
                "emotion_entered": doc.get("emotion_entered", ""),
                "emotion_quited": doc.get("emotion_quited", ""),
                "image_entered": image_entered,  # Base64 encoded image
                "image_quited": image_quited,  # Base64 encoded image or None
                "person_id": str(doc.get("person_id", ""))  # Convert ObjectId to string
            })

        return log_data

    def add_sample_records_to_db(self):
        sample_data = [
            {
                "employee_id": "325",
                "first_name": "Görkem",
                "last_name": "Karamolla",
                "title": "Software Engineer",
                "address": "Şişli,İstanbul",
                "phone1": "5395455259",
                "phone2": "",
                "email": "gorkemkaramolla@gmail.com",
                "mobile": "0539",
                "biography": "Software Engineer",
                "birth_date": "03.03.1997",
                "iso_phone1": "2522900",
                "iso_phone2": "",
                "photo_file_type": "image/jpeg",
                "image_path": "/face-images/gorkemkaramolla.jpg"
            },
            {
                "employee_id": "324",
                "first_name": "Fatih",
                "last_name": "Yavuz",
                "title": "Software Engineer",
                "address": "Şişli,İstanbul",
                "phone1": "5395455259",
                "phone2": "",
                "email": "yvzfth3@gmail.com",
                "mobile": "0539",
                "biography": "Software Engineer",
                "birth_date": "03.03.1997",
                "iso_phone1": "2522900",
                "iso_phone2": "",
                "photo_file_type": "image/jpeg",
                "image_path": "/face-images/FatihYavuz.jpg"
            },
        ]

        # Assuming a MongoDB collection named 'Person'
        person_collection = self.db['Person']
        person_collection.insert_many(sample_data)

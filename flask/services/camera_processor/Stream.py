import base64
import logging
import os
import threading
import datetime
from typing import List, Tuple, Dict, Any
import cv2
import numpy as np
from pymongo import MongoClient
import torch
import onnxruntime
from services.camera_processor.scrfd import SCRFD
from services.camera_processor.arcface_onnx import ArcFaceONNX
from services.camera_processor.attribute import Attribute
from services.camera_processor.emotion import EmotionDetector
from socketio_instance import notify_new_face
import subprocess

class Stream:
    def __init__(self, device: str = "cuda") -> None:
        self.device = torch.device(device)
        onnxruntime.set_default_logger_severity(3)  # 3: INFO, 2: WARNING, 1: ERROR
        onnx_models_dir = os.path.expanduser("~/.insightface/models/buffalo_l")
        
        # Face Detection
        face_detector_model = os.path.join(onnx_models_dir, "det_10g.onnx")
        self.face_detector = SCRFD(face_detector_model)
        self.face_detector.prepare(0 if device == "cuda" else -1)
        
        # Face Recognition
        self.last_recognitions: Dict[str, datetime.datetime] = {}
        self.similarity_threshold: float = 0.2
        face_rec_model = os.path.join(onnx_models_dir, "w600k_r50.onnx")
        self.face_recognizer = ArcFaceONNX(face_rec_model)
        self.face_recognizer.prepare(0 if device == "cuda" else -1)
        
        # Gender Age
        gender_age_model = os.path.join(onnx_models_dir, "genderage.onnx")
        self.gender_age_detector = Attribute(gender_age_model)
        self.gender_age_detector.prepare(0 if device == "cuda" else -1)
        
        # Emotion
        emotion_model = os.path.join(onnx_models_dir, "emotion_model.onnx")
        self.emotion_detector = EmotionDetector(emotion_model)

        self.database: Dict[str, np.ndarray] = self._create_face_database(
            self.face_recognizer,
            self.face_detector,
            os.path.join(os.getcwd(), "face-images"),
        )

        # Face Recognition Image Directories
        self.known_faces_dir: str = "recog/known_faces"
        os.makedirs(self.known_faces_dir, exist_ok=True)
        self.unknown_faces_dir: str = "recog/unknown_faces"
        os.makedirs(self.unknown_faces_dir, exist_ok=True)
        
        # MongoDB
        client = MongoClient(os.getenv("MONGO_DB_URI"))
        self.db = client["isoai"]
        self.recognition_logs_collection = self.db["logs"]

        self.stop_flag = threading.Event()  # Initialize the stop flag
        self.video_writer = None
        
    def _create_face_database(self, face_recognizer: ArcFaceONNX, face_detector: SCRFD, image_folder: str) -> Dict[str, np.ndarray]:
        database: Dict[str, np.ndarray] = {}
        for filename in os.listdir(image_folder):
            if filename.endswith((".jpg", ".jpeg", ".png")):
                name = os.path.splitext(filename)[0]
                image_path = os.path.join(image_folder, filename)
                image = cv2.imread(image_path)
                image = cv2.copyMakeBorder(
                    image, 
                    640, 640, 640, 640, 
                    cv2.BORDER_CONSTANT, 
                    value=[255, 255, 255]
                )
                bboxes, kpss = face_detector.detect(image, input_size=(640,640), thresh=0.5, max_num=1, metric="max")
                if len(bboxes) > 0:
                    kps = kpss[0]
                    embedding = face_recognizer.get(image, kps)
                    database[name] = embedding
        print(f"--------------Database created with {len(database)} entries.--------------")
        return database
  
    def update_database(self, old_name: str, new_name: str) -> None:
        """
        Update the database key from old_name to new_name.

        :param old_name: The old key name in the database.
        :param new_name: The new key name to update in the database.
        """
        # Check if the old_name exists in the database
        if old_name in self.database:
            # Update the key with the new_name
            self.database[new_name] = self.database.pop(old_name)
            print(f"Database key updated from {old_name} to {new_name}")
        else:
            print(f"No entry found for {old_name} in the database.")

          # Define possible extensions
        extensions = ['jpeg', 'jpg', 'png']
        new_image_path = None

        # Check for the existence of the image with any of the extensions
        for ext in extensions:
            path = os.path.join('./face-images', f"{new_name}.{ext}")
            if os.path.exists(path):
                new_image_path = path
                break

        if new_image_path:
            if self.database.get(new_name) is None:
                image = cv2.imread(new_image_path)
                bboxes, kpss = self.face_detector.detect(image, max_num=1, input_size=(640,640))
                if len(bboxes) > 0:
                    kps = kpss[0]
                    embedding = self.face_recognizer.get(image, kps)
                    self.database[new_name] = embedding
                    print(f"Database updated with new embedding for {new_name}")
                else:
                    print("No face detected in the new image.")
            else:
                print(f"Database already contains an embedding for {new_name}")
        else:
            print(f"No image found for {new_name} with extensions {extensions}")

    def _save_and_log_face(
        self, face_image: np.ndarray | None, label: str, similarity: float, emotion: str, gender: str, age: int, is_known: bool
    ) -> str:
        if face_image is None:
            print("Error: The face image is empty and cannot be saved.")
            return "Error: Empty face image"
        now = datetime.datetime.now()
        timestamp = int(now.timestamp() * 1000)
        if label in self.last_recognitions:
            last_recognition_time = self.last_recognitions[label]
            time_diff = (now - last_recognition_time).total_seconds()
            if time_diff < 60:
                return "Already recognized recently"

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
            "gender": gender,
            "age": age,
            "image_path": file_path,
        }
        notify_new_face(log_record)
        self.recognition_logs_collection.insert_one(log_record)

        return file_path

    def _get_attributes(
        self, frame: np.ndarray
    ) -> Tuple[
        List[np.ndarray], List[str], List[float], List[str], List[str], List[int]
    ]:
        
        if frame is None or len(frame.shape) < 2:
            return [], [], [], [], [], []

        bboxes, kpss = self.face_detector.detect(frame, max_num=49, input_size=(640, 640))
        if len(bboxes) == 0:
            return [], [], [], [], [], []

        labels, sims, emotions, ages, genders = [], [], [], [], []

        for idx, kps in enumerate(kpss):
            embedding = self.face_recognizer.get(frame, kps)
            min_dist = float("inf")
            best_match = None
            label = "Unknown"
            is_known = False

            for name, db_embedding in self.database.items():
                dist = np.linalg.norm(db_embedding - embedding)
                if dist < min_dist:
                    min_dist = dist
                    best_match = name

            sim = self.face_recognizer.compute_sim(embedding, self.database.get(best_match, np.zeros_like(embedding)))
            if sim >= self.similarity_threshold:
                label = best_match
                is_known = True

            bbox = bboxes[idx]
            x1, y1, x2, y2 = map(int, bbox[:4])
            face_image = frame[y1:y2, x1:x2]

            # if not is_known:
            #     label = f"x-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
            #     self.database[label] = embedding

            labels.append(label)
            sims.append(sim)

            gender, age = self.gender_age_detector.get(frame, face=bbox)
            ages.append(age)
            genders.append("M" if gender == 1 else "F")

            emotion = self.emotion_detector.detect_emotion_from_array(face_image)
            emotions.append(emotion)

            if is_known:

                self._save_and_log_face(face_image, label, sim, emotion, gender, age, is_known)

        return bboxes, labels, sims, emotions, genders, ages
    
    def recog_face_ip_cam(self, stream_id, camera: str, is_recording=False):
        self.stop_flag.clear()
        logging.info(f"Opening stream: {stream_id} / camera: {camera}")
        if camera is None:
            raise ValueError("Camera URL must be provided and cannot be None")
        
        cap = cv2.VideoCapture(camera)
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

            for bbox, label, sim, emotion, gender, age in zip(
                *self._get_attributes(frame)
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
    
    def recog_face_local_cam(self, frame: np.ndarray, is_recording: bool = False) -> str:
        self.stop_flag.clear()
        
        logging.info("Processing frame")
        
        if is_recording and self.video_writer is None:
            now = datetime.datetime.now()
            directory = "./records/"
            os.makedirs(directory, exist_ok=True)
            filename = directory + now.strftime("%H-%M-%S_%d-%m-%Y_yerel_camera") + ".mp4"
            frame_height, frame_width = frame.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            self.video_writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))
            if not self.video_writer.isOpened():
                logging.error("Error initializing video writer")
                return ""

        for bbox, label, sim, emotion, gender, age in zip(*self._get_attributes(frame)):
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

        if self.video_writer:
            self.video_writer.write(frame)

      
        
        _, buffer = cv2.imencode(".jpg", frame)
        processed_image = base64.b64encode(buffer).decode('utf-8')
        return 'data:image/jpeg;base64,' + processed_image
    
    def start_stream(self, stream_id, camera, quality="Quality", is_recording=False):
   

        self.stop_flag.clear()
        self.stop_flag = threading.Event()  
        logging.info(f"Starting stream: {stream_id} / camera: {camera}")
     

     

    def stop_stream(self, stream_id: int) -> None:
        """
        Stops the ongoing video stream with the given ID by setting the stop flag.
        Releases video capture and writer resources if they are in use.
        """
    
        self.stop_flag.set()
        
        logging.info(f"Stream with ID {stream_id} stopped successfully")


    
    def stop_recording(self):
        if self.video_writer:
            self.video_writer.release()
            self.video_writer = None
    
            # Find the last saved file in the ./records folder
            records_folder = './records'
            files = [os.path.join(records_folder, f) for f in os.listdir(records_folder) if os.path.isfile(os.path.join(records_folder, f))]
            last_saved_file = max(files, key=os.path.getctime)
    
            # Define output file path
            output_file = last_saved_file.replace(".mp4", "_converted.mp4")
    
            # Execute ffmpeg command to convert video
            command = ["ffmpeg", "-i", last_saved_file, "-vcodec", "h264", "-acodec", "aac", output_file]
    
            # Run the command
            subprocess.run(command, capture_output=True, text=True)
    
            return output_file
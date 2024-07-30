import base64
import logging
import os
import threading
import datetime
from typing import List, Tuple, Dict, Any, Optional
import cv2
import numpy as np
from pymongo import MongoClient
import torch
import onnxruntime
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX
from attribute import Attribute
from emotion import EmotionDetector
# from socketio_instance import notify_new_face

class Stream:

    def __init__(
        self,
        device: str = "cuda",
        use_face_recognition: bool = True,
        use_gender_age: bool = True,
        use_emotion: bool = True
    ) -> None:
        self.device = torch.device(device)
        onnxruntime.set_default_logger_severity(3)  # 3: INFO, 2: WARNING, 1: ERROR
        onnx_models_dir = os.path.expanduser("~/.insightface/models/buffalo_l")
        
        # Face Detection
        face_detector_model = os.path.join(onnx_models_dir, "det_10g.onnx")
        self.face_detector = SCRFD(face_detector_model)
        self.face_detector.prepare(0 if device == "cuda" else -1)
        
        # Face Recognition
        self.use_face_recognition = use_face_recognition
        self.face_recognizer = None
        self.last_recognitions: Dict[str, datetime.datetime] = {}
        if use_face_recognition:
            self.similarity_threshold: float = 0.2
            face_rec_model = os.path.join(onnx_models_dir, "w600k_r50.onnx")
            self.face_recognizer = ArcFaceONNX(face_rec_model)
            self.face_recognizer.prepare(0 if device == "cuda" else -1)
        
        # Gender Age
        self.use_gender_age = use_gender_age
        self.gender_age_detector = None
        if use_gender_age:
            gender_age_model = os.path.join(onnx_models_dir, "genderage.onnx")
            self.gender_age_detector = Attribute(gender_age_model)
            self.gender_age_detector.prepare(0 if device == "cuda" else -1)
        
        # Emotion
        self.use_emotion = use_emotion
        self.emotion_detector = None
        if use_emotion:
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

    
    def _create_face_database(self, face_recognizer: Optional[ArcFaceONNX], face_detector: SCRFD, image_folder: str) -> Dict[str, np.ndarray]:
        database: Dict[str, np.ndarray] = {}
        if not face_recognizer:
            return database
        for filename in os.listdir(image_folder):
            if filename.endswith((".jpg", ".png")):
                name = os.path.splitext(filename)[0]
                image_path = os.path.join(image_folder, filename)
                image = cv2.imread(image_path)
                bboxes, kpss = face_detector.autodetect(image, max_num=1)
                if bboxes.shape[0] > 0:
                    kps = kpss[0]
                    embedding = face_recognizer.get(image, kps)
                    database[name] = embedding
        return database

    def _save_and_log_face(
        self, face_image: np.ndarray | None, label: str, similarity: float, emotion: str, gender: str, age: int, is_known: bool
    ) -> str:
        if face_image is None:
            # print("Error: The face image is empty and cannot be saved.")
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
        # notify_new_face(log_record)
        self.recognition_logs_collection.insert_one(log_record)

        return file_path

    def _get_attributes(
        self, frame: np.ndarray
    ) -> Tuple[
        List[np.ndarray], List[str], List[float], List[str], List[str], List[int]
    ]:

        if frame is None or len(frame.shape) < 2:
            return [], [], [], [], [], []

        bboxes, kpss = self.face_detector.autodetect(frame, max_num=49)
        if len(bboxes) == 0:
            return [], [], [], [], [], []

        labels, sims, emotions, ages, genders = [], [], [], [], []

        for idx, kps in enumerate(kpss):
            label = "Unknown"
            sim = 0.0
            face_image = None
            is_known = False
            if self.face_recognizer:
                embedding = self.face_recognizer.get(frame, kps)
                min_dist = float("inf")
                best_match = None

                for name, db_embedding in self.database.items():
                    dist = np.linalg.norm(db_embedding - embedding)
                    if dist < min_dist:
                        min_dist = dist
                        best_match = name

                sim = self.face_recognizer.compute_sim(embedding, self.database.get(best_match, np.zeros_like(embedding)))
                if sim >= self.similarity_threshold:
                    label = best_match
                    is_known = True

                if not is_known:
                    label = f"x-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
                    self.database[label] = embedding

                labels.append(label)
                sims.append(sim)
            else:
                labels.append("Unknown")
                sims.append(0.0)

            if self.gender_age_detector:
                gender, age = self.gender_age_detector.get(frame, face=bboxes[idx])
                ages.append(age)
                genders.append("M" if gender == 1 else "F")
            else:
                ages.append(-1)
                genders.append("U")

            if self.emotion_detector:
                face_image = frame[int(bboxes[idx][1]):int(bboxes[idx][3]), int(bboxes[idx][0]):int(bboxes[idx][2])]
                emotion = self.emotion_detector.detect_emotion_from_array(face_image)
                emotions.append(emotion)
            else:
                emotions.append("Unknown")

            self._save_and_log_face(
                face_image if 'face_image' in locals() else None,
                label,
                sims[-1],
                emotions[-1],
                genders[-1],
                ages[-1],
                is_known
            )

        return bboxes, labels, sims, emotions, genders, ages

    
    def recog_face_ip_cam(self, stream_id, camera, quality="Quality", is_recording=False):
        self.stop_flag.clear()  # Clear the stop flag at the beginning
        logging.info(f"Opening stream: {stream_id} / camera: {camera}")
       
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

    def recog_face_local_cam(self, frame: np.ndarray, is_recording: bool = False) -> np.ndarray:
        self.stop_flag.clear()
        # logging.info("Processing frame")

        if is_recording and self.video_writer is None:
            now = datetime.datetime.now()
            directory = "./records/"
            os.makedirs(directory, exist_ok=True)
            filename = directory + now.strftime("%H-%M-%S_%d-%m-%Y") + ".mp4"
            frame_height, frame_width = frame.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            self.video_writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))
            if not self.video_writer.isOpened():
                logging.error("Error initializing video writer")
                return None

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

        return frame

    def open_local_camera(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            logging.error("Error opening local camera")
            return

        while not self.stop_flag.is_set():
            ret, frame = cap.read()
            if not ret:
                logging.error("Error reading frame from local camera")
                break

            processed_frame = self.recog_face_local_cam(frame)
            if processed_frame is not None:
                cv2.imshow('Processed Frame', processed_frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        cap.release()
        cv2.destroyAllWindows()

    
def main():
    logging.basicConfig(level=logging.INFO)
    stream = Stream(
        device="cuda",
        use_face_recognition=True,
        use_gender_age=True,
        use_emotion=True
    )

    stream.open_local_camera()

if __name__ == "__main__":
    main()


# import base64
# import logging
# import os
# import threading
# import datetime
# from typing import List, Tuple, Dict, Any
# import cv2
# import numpy as np
# from pymongo import MongoClient
# import torch
# import onnxruntime
# from services.camera_processor.scrfd import SCRFD
# from services.camera_processor.arcface_onnx import ArcFaceONNX
# from services.camera_processor.attribute import Attribute
# from services.camera_processor.emotion import EmotionDetector
# from socketio_instance import notify_new_face

# class Stream:
#     def __init__(self, device: str = "cuda") -> None:
#         self.device = torch.device(device)
#         onnxruntime.set_default_logger_severity(3)  # 3: INFO, 2: WARNING, 1: ERROR
#         onnx_models_dir = os.path.expanduser("~/.insightface/models/buffalo_l")
        
#         # Face Detection
#         face_detector_model = os.path.join(onnx_models_dir, "det_10g.onnx")
#         self.face_detector = SCRFD(face_detector_model)
#         self.face_detector.prepare(0 if device == "cuda" else -1)
        
#         # Face Recognition
#         self.last_recognitions: Dict[str, datetime.datetime] = {}
#         self.similarity_threshold: float = 0.2
#         face_rec_model = os.path.join(onnx_models_dir, "w600k_r50.onnx")
#         self.face_recognizer = ArcFaceONNX(face_rec_model)
#         self.face_recognizer.prepare(0 if device == "cuda" else -1)
        
#         # Gender Age
#         gender_age_model = os.path.join(onnx_models_dir, "genderage.onnx")
#         self.gender_age_detector = Attribute(gender_age_model)
#         self.gender_age_detector.prepare(0 if device == "cuda" else -1)
        
#         # Emotion
#         emotion_model = os.path.join(onnx_models_dir, "emotion_model.onnx")
#         self.emotion_detector = EmotionDetector(emotion_model)

#         self.database: Dict[str, np.ndarray] = self._create_face_database(
#             self.face_recognizer,
#             self.face_detector,
#             os.path.join(os.getcwd(), "face-images"),
#         )

#         # Face Recognition Image Directories
#         self.known_faces_dir: str = "recog/known_faces"
#         os.makedirs(self.known_faces_dir, exist_ok=True)
#         self.unknown_faces_dir: str = "recog/unknown_faces"
#         os.makedirs(self.unknown_faces_dir, exist_ok=True)
        
#         # MongoDB
#         client = MongoClient(os.getenv("MONGO_DB_URI"))
#         self.db = client["isoai"]
#         self.recognition_logs_collection = self.db["logs"]

#         self.stop_flag = threading.Event()  # Initialize the stop flag
#         self.video_writer = None
    
#     def _create_face_database(self, face_recognizer: ArcFaceONNX, face_detector: SCRFD, image_folder: str) -> Dict[str, np.ndarray]:
#         database: Dict[str, np.ndarray] = {}
#         for filename in os.listdir(image_folder):
#             if filename.endswith((".jpg", ".png")):
#                 name = os.path.splitext(filename)[0]
#                 image_path = os.path.join(image_folder, filename)
#                 image = cv2.imread(image_path)
#                 bboxes, kpss = face_detector.autodetect(image, max_num=1)
#                 if bboxes.shape[0] > 0:
#                     kps = kpss[0]
#                     embedding = face_recognizer.get(image, kps)
#                     database[name] = embedding
#         return database

#     def _save_and_log_face(
#         self, face_image: np.ndarray | None, label: str, similarity: float, emotion: str, gender: str, age: int, is_known: bool
#     ) -> str:
#         if face_image is None:
#             print("Error: The face image is empty and cannot be saved.")
#             return "Error: Empty face image"
#         now = datetime.datetime.now()
#         timestamp = int(now.timestamp() * 1000)
#         if label in self.last_recognitions:
#             last_recognition_time = self.last_recognitions[label]
#             time_diff = (now - last_recognition_time).total_seconds()
#             if time_diff < 60:
#                 return "Already recognized recently"

#         self.last_recognitions[label] = now
#         filename_timestamp = now.strftime("%Y%m%d-%H%M%S")
#         filename = f"{label}-{filename_timestamp}.jpg"
#         base_dir = self.known_faces_dir if is_known else self.unknown_faces_dir
#         person_dir = os.path.join(base_dir, label)
#         os.makedirs(person_dir, exist_ok=True)
#         file_path = os.path.join(person_dir, filename)
#         print(f"Saving face image to: {file_path}")

#         try:
#             success = cv2.imwrite(file_path, face_image)
#             if not success:
#                 print("Error: Failed to save the image.")
#                 return "Error: Failed to save image"
#         except cv2.error as e:
#             print(f"OpenCV error: {e}")
#             return f"Error: OpenCV error - {e}"
#         except PermissionError as e:
#             print(f"Permission error: {e}")
#             return f"Error: Permission error - {e}"
#         except FileNotFoundError as e:
#             print(f"File not found error: {e}")
#             return f"Error: File not found error - {e}"
#         except Exception as e:
#             print(f"Unexpected error: {e}")
#             return f"Error: Unexpected error - {e}"

#         log_record = {
#             "timestamp": timestamp,
#             "label": label,
#             "similarity": round(float(similarity), 2),
#             "emotion": emotion,
#             "gender": gender,
#             "age": age,
#             "image_path": file_path,
#         }
#         notify_new_face(log_record)
#         self.recognition_logs_collection.insert_one(log_record)

#         return file_path

#     def _get_attributes(
#         self, frame: np.ndarray
#     ) -> Tuple[
#         List[np.ndarray], List[str], List[float], List[str], List[str], List[int]
#     ]:
        
#         if frame is None or len(frame.shape) < 2:
#             return [], [], [], [], [], []

#         bboxes, kpss = self.face_detector.autodetect(frame, max_num=49)
#         if len(bboxes) == 0:
#             return [], [], [], [], [], []

#         labels, sims, emotions, ages, genders = [], [], [], [], []

#         for idx, kps in enumerate(kpss):
#             embedding = self.face_recognizer.get(frame, kps)
#             min_dist = float("inf")
#             best_match = None
#             label = "Unknown"
#             is_known = False

#             for name, db_embedding in self.database.items():
#                 dist = np.linalg.norm(db_embedding - embedding)
#                 if dist < min_dist:
#                     min_dist = dist
#                     best_match = name

#             sim = self.face_recognizer.compute_sim(embedding, self.database.get(best_match, np.zeros_like(embedding)))
#             if sim >= self.similarity_threshold:
#                 label = best_match
#                 is_known = True

#             bbox = bboxes[idx]
#             x1, y1, x2, y2 = map(int, bbox[:4])
#             face_image = frame[y1:y2, x1:x2]

#             if not is_known:
#                 label = f"x-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
#                 self.database[label] = embedding

#             labels.append(label)
#             sims.append(sim)

#             gender, age = self.gender_age_detector.get(frame, face=bbox)
#             ages.append(age)
#             genders.append("M" if gender == 1 else "F")

#             emotion = self.emotion_detector.detect_emotion_from_array(face_image)
#             emotions.append(emotion)

#             self._save_and_log_face(face_image, label, sim, emotion, gender, age, is_known)

#         return bboxes, labels, sims, emotions, genders, ages
    
#     def recog_face_ip_cam(self, stream_id, camera, quality="Quality", is_recording=False):
#         self.stop_flag.clear()  # Clear the stop flag at the beginning
#         logging.info(f"Opening stream: {stream_id} / camera: {camera}")
       
#         cap = cv2.VideoCapture(camera + quality)
#         print("Camera Opened:  " + str(cap.isOpened()))
#         writer = None
#         if is_recording:
#             now = datetime.datetime.now()
#             directory = "./records/"
#             if not os.path.exists(directory):
#                 os.makedirs(directory)
#             filename = directory + now.strftime("%H:%M:%S_%d.%m.%Y") + ".mp4"
#         while not self.stop_flag.is_set():
#             ret, frame = cap.read()
#             if not ret:
#                 logging.error("Error reading frame")
#                 break
#             if is_recording and writer is None:
#                 frame_height, frame_width = frame.shape[:2]
#                 fourcc = cv2.VideoWriter_fourcc(*"mp4v")
#                 writer = cv2.VideoWriter(
#                     filename, fourcc, 20.0, (frame_width, frame_height)
#                 )
#                 if not writer.isOpened():
#                     logging.error("Error initializing video writer")
#                     break

#             for bbox, label, sim, emotion, gender, age in zip(
#                 *self._get_attributes(frame)
#             ):
#                 x1, y1, x2, y2 = map(int, bbox[:4])
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)
#                 text_label = f"{label} ({sim * 100:.2f}%): {emotion}, gender: {gender}, age: {age}"
#                 cv2.putText(
#                     frame,
#                     text_label,
#                     (x1 + 5, y1 - 10),
#                     cv2.FONT_HERSHEY_SIMPLEX,
#                     0.8,
#                     (0, 255, 0),
#                     2,
#                 )
#             if writer:
#                 writer.write(frame)
#             _, buffer = cv2.imencode(".jpg", frame)
#             yield (
#                 b"--frame\r\n"
#                 b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
#             )
#         cap.release()
#         if writer:
#             writer.release()
#         logging.info("Finished generate function")

#     def recog_face_local_cam(self, frame: np.ndarray, is_recording: bool = False) -> str:
#         self.stop_flag.clear()
#         logging.info("Processing frame")

#         if is_recording and self.video_writer is None:
#             now = datetime.datetime.now()
#             directory = "./records/"
#             os.makedirs(directory, exist_ok=True)
#             filename = directory + now.strftime("%H-%M-%S_%d-%m-%Y") + ".mp4"
#             frame_height, frame_width = frame.shape[:2]
#             fourcc = cv2.VideoWriter_fourcc(*"mp4v")
#             self.video_writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))
#             if not self.video_writer.isOpened():
#                 logging.error("Error initializing video writer")
#                 return ""

#         for bbox, label, sim, emotion, gender, age in zip(*self._get_attributes(frame)):
#             x1, y1, x2, y2 = map(int, bbox[:4])
#             cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)
#             text_label = f"{label} ({sim * 100:.2f}%): {emotion}, gender: {gender}, age: {age}"
#             cv2.putText(
#                 frame,
#                 text_label,
#                 (x1 + 5, y1 - 10),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.8,
#                 (0, 255, 0),
#                 2,
#             )

#         if self.video_writer:
#             self.video_writer.write(frame)

#         _, buffer = cv2.imencode(".jpg", frame)
#         processed_image = base64.b64encode(buffer).decode('utf-8')
#         return 'data:image/jpeg;base64,' + processed_image
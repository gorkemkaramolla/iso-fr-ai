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
import time
import json
from urllib.request import urlopen
from urllib.error import URLError, HTTPError
import requests
import os
from services.camera_processor.anti_spoof_predict import AntiSpoofPredict
from services.camera_processor.generate_patches import CropImage
from services.camera_processor.utility import parse_model_name
from collections import defaultdict
    
# Unset proxy environment variables
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('ALL_PROXY', None)
# from flask import jsonify
# import requests
class Stream:
    def __init__(self, device: str = "cuda", anti_spoof: bool = False) -> None:
        # self.device = torch.device(device)
        onnxruntime.set_default_logger_severity(3)  # 3: INFO, 2: WARNING, 1: ERROR
        onnx_models_dir = os.path.abspath(os.path.join(__file__, "../../models/buffalo_l"))
        # onnx_models_dir = os.path.expanduser("~/.insightface/models/buffalo_l")
        print(f"Loading models from: {onnx_models_dir}")
        # Face Detection
        face_detector_model = os.path.join(onnx_models_dir, "det_10g.onnx")
        self.face_detector = SCRFD(face_detector_model)
        self.face_detector.prepare(0 )
        # self.face_detector.prepare(0 if device == "cuda" else -1)
        
        # Face Recognition
        self.last_recognitions: Dict[str, datetime.datetime] = {}
        self.similarity_threshold: float = 0.4
        face_rec_model = os.path.join(onnx_models_dir, "w600k_r50.onnx")
        self.face_recognizer = ArcFaceONNX(face_rec_model)
        self.face_recognizer.prepare(0 )
        # self.face_recognizer.prepare(0 if device == "cuda" else -1)
        
        # Gender Age
        gender_age_model = os.path.join(onnx_models_dir, "genderage.onnx")
        self.gender_age_detector = Attribute(gender_age_model)
        self.gender_age_detector.prepare(0)
        # self.gender_age_detector.prepare(0 if device == "cuda" else -1)
        
        # Emotion
        emotion_model = os.path.join(onnx_models_dir, "emotion_model.onnx")
        self.emotion_detector = EmotionDetector(emotion_model)

        # Anti-Spoofing
        # anti_spoofing_model_path="../models/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth"
        self.anti_spoof = anti_spoof
        if self.anti_spoof:
            self.anti_spoofing_model_path = "/app/services/models/anti_spoof_models/"
            self.anti_spoof_predictor = AntiSpoofPredict(self.anti_spoofing_model_path, face_detector_model)
            self.image_cropper = CropImage()
        # MongoDB
        client = MongoClient(os.getenv("MONGO_DB_URI"))
        self.db = client["isoai"]
        self.recognition_logs_collection = self.db["logs"]
        
        self.database: Dict[str, Dict[str, np.ndarray]] = {}
        self.create_face_database()
        
        # Face Recognition Image Directories
        self.known_faces_dir: str = "recog/known_faces"
        os.makedirs(self.known_faces_dir, exist_ok=True)
        self.unknown_faces_dir: str = "recog/unknown_faces"
        os.makedirs(self.unknown_faces_dir, exist_ok=True)
        

        self.stop_flag = threading.Event()  # Initialize the stop flag
        self.video_writer = None

        # Store recognition data for each personnel_id to aggregate data over 60 seconds
        self.recognition_data = defaultdict(lambda: {
            "timestamps": [],
            "label": None, 
            "similarities": [],
            "emotions": [],
            "genders": [],
            "ages": [],
            "image_path": None,
            "camera_name": None,
            "personnel_id": None
        })
        self._start_background_saver()
    def create_face_database(self) -> Dict[str, np.ndarray]:
        url = "http://localhost:5004/personel"
        # url = "http://utils_service:5004/personel"
        image_url_template = "http://localhost:5004/personel/image/?id={user_id}"
        # image_url_template = "http://utils_service:5004/personel/image/?id={user_id}"
        
        try:
            # Disable proxy for this request
            response = requests.get(url, proxies={"http": None, "https": None})
            response.raise_for_status()  # Raise an HTTPError for bad responses
            personnel_records = response.json()
            
            print("Personnel Records:")
            for record in personnel_records:
                print("---------Personnel Record---------")
                print(record)
                
                # Retrieve the image
                user_id = record.get('_id')
                if user_id:
                    try:
                        # Personel Label
                        label = f"{record['name']} {record['lastname']}"
                        
                        image_url = image_url_template.format(user_id=user_id)
                        image_response = requests.get(image_url, proxies={"http": None, "https": None})
                        image_response.raise_for_status()
                        
                        # Process the image to get the embedding
                        image_array = np.frombuffer(image_response.content, np.uint8)
                        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                        image = cv2.copyMakeBorder(
                            image, 
                            640, 640, 640, 640, 
                            cv2.BORDER_CONSTANT, 
                            value=[255, 255, 255]
                        )
                        bboxes, kpss = self.face_detector.detect(image, input_size=(640,640), thresh=0.5, max_num=1)
                        if len(bboxes) > 0:
                            kps = kpss[0]
                            embedding = self.face_recognizer.get(image, kps)
                            key = f"{record['_id']}"
                            # key = f"{record['name']}_{record['lastname']}"
                            self.database[key] = {"embedding": embedding, "label": label}
                            print(f"Embedding saved for {key}")
                    except requests.exceptions.RequestException as e:
                        print(f"An error occurred while fetching the image: {e}")
                else:
                    print("No user ID found for this record.")
        except requests.exceptions.RequestException as e:
            print(f"An error occurred: {e}")
    def update_database_with_personnel_id(self, personnel_id: str) -> None:
        personnel_url = f"http://localhost:5004/personel/{personnel_id}"
        image_url_template = f"http://localhost:5004/personel/image/?id={personnel_id}"
        
        try:
            # Fetch personnel record
            response = requests.get(personnel_url, proxies={"http": None, "https": None})
            response.raise_for_status()  # Raise an HTTPError for bad responses
            personnel_record = response.json()
            
            print("Personnel Record:")
            print(personnel_record)
            
            # Retrieve the image
            if personnel_record:
                try:
                    # Personnel Label
                    label = f"{personnel_record['name']} {personnel_record['lastname']}" 
                    
                    image_url = image_url_template.format(user_id=personnel_id)
                    image_response = requests.get(image_url, proxies={"http": None, "https": None})
                    image_response.raise_for_status()
                    
                    # Process the image to get the embedding
                    image_array = np.frombuffer(image_response.content, np.uint8)
                    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                    image = cv2.copyMakeBorder(
                        image, 
                        640, 640, 640, 640, 
                        cv2.BORDER_CONSTANT, 
                        value=[255, 255, 255]
                    )
                    bboxes, kpss = self.face_detector.detect(image, input_size=(640,640), thresh=0.5, max_num=1)
                    if len(bboxes) > 0:
                        kps = kpss[0]
                        embedding = self.face_recognizer.get(image, kps)
                        key = personnel_id
                        self.database[key] = {"embedding": embedding, "label": label}
                        print(f"Embedding saved for {key}")
                except requests.exceptions.RequestException as e:
                    print(f"An error occurred while fetching the image: {e}")
            else:
                print("Personnel record not found.")
        except requests.exceptions.RequestException as e:
            print(f"An error occurred: {e}")

    
    def _start_background_saver(self):
        def background_saver():
            while True:
                # print(database)
                now = datetime.datetime.now().timestamp() * 1000
                for personnel_id in list(self.recognition_data.keys()):
                    first_timestamp = self.recognition_data[personnel_id]["timestamps"][0]
                    if now - first_timestamp >= 60000:
                        self._save_aggregated_data(personnel_id)
                time.sleep(5)  # Check every 5 seconds

        saver_thread = threading.Thread(target=background_saver, daemon=True)
        saver_thread.start()
    
    # def _save_and_log_face(self, face_image, label, similarity, emotion, gender, age, is_known, camera_name, personnel_id):
    #     if face_image is None:
    #         print("Error: The face image is empty and cannot be saved.")
    #         return "Error: Empty face image"
        
    #     if personnel_id is None:
    #         print("Error: Personnel ID is None and cannot be saved.")
    #         return "Error: Personnel ID is None"
    
    #     now = datetime.datetime.now()
    #     timestamp = int(now.timestamp() * 1000)
    
    #     # Store the first face image
    #     if self.recognition_data[personnel_id]["image_path"] is None:
    #         # Generate filename and directory path
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
    
    #         self.recognition_data[personnel_id]["image_path"] = file_path
    
    #     # Store recognition data
    #     self.recognition_data[personnel_id]["personnel_id"] = personnel_id
    #     self.recognition_data[personnel_id]["label"] = self.database[personnel_id]["label"] 
    #     self.recognition_data[personnel_id]["genders"].append(gender)
    #     self.recognition_data[personnel_id]["timestamps"].append(timestamp)
    #     self.recognition_data[personnel_id]["similarities"].append(float(similarity))  # Convert to native Python float
    #     self.recognition_data[personnel_id]["emotions"].append(emotion)
    #     self.recognition_data[personnel_id]["ages"].append(age)
    #     self.recognition_data[personnel_id]["camera_name"] = camera_name
    
    #     # Write recognition data to JSON
    #     json_file_path = './recognition_data.json'
    
    #     def convert_numpy_types(obj):
    #         if isinstance(obj, np.ndarray):
    #             return obj.tolist()
    #         if isinstance(obj, (np.float32, np.float64)):
    #             return float(obj)
    #         if isinstance(obj, (np.int32, np.int64)):
    #             return int(obj)
    #         return obj
    
    #     try:
    #         with open(json_file_path, mode='w') as json_file:
    #             json.dump(self.recognition_data, json_file, indent=4, default=convert_numpy_types)
    #     except IOError as e:
    #         print(f"I/O error: {e}")
    #         return f"Error: I/O error - {e}"
    
    #     return self.recognition_data[personnel_id]["image_path"]
    def _save_and_log_face(self, face_image, label, similarity, emotion, gender, age, is_known, camera_name, personnel_id):
        if face_image is None:
            print("Error: The face image is empty and cannot be saved.")
            return "Error: Empty face image"
        
        if personnel_id is None:
            print("Error: Personnel ID is None and cannot be saved.")
            return "Error: Personnel ID is None"
        
        now = datetime.datetime.now()
        timestamp = int(now.timestamp() * 1000)
        
        # Store the first face image
        if self.recognition_data[personnel_id]["image_path"] is None:
            # Generate filename and directory path
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
        
            self.recognition_data[personnel_id]["image_path"] = file_path
        
        # Store recognition data
        self.recognition_data[personnel_id]["personnel_id"] = personnel_id
        self.recognition_data[personnel_id]["label"] = label
        self.recognition_data[personnel_id]["genders"].append(gender)
        self.recognition_data[personnel_id]["timestamps"].append(timestamp)
        self.recognition_data[personnel_id]["similarities"].append(float(similarity))  # Convert to native Python float
        self.recognition_data[personnel_id]["emotions"].append(emotion)
        self.recognition_data[personnel_id]["ages"].append(age)
        self.recognition_data[personnel_id]["camera_name"] = camera_name
        
        # Write recognition data to JSON
        json_file_path = './recognition_data.json'
        
        def convert_numpy_types(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            if isinstance(obj, (np.float32, np.float64)):
                return float(obj)
            if isinstance(obj, (np.int32, np.int64)):
                return int(obj)
            return obj
        
        try:
            with open(json_file_path, mode='w') as json_file:
                json.dump(self.recognition_data, json_file, indent=4, default=convert_numpy_types)
        except IOError as e:
            print(f"I/O error: {e}")
            return f"Error: I/O error - {e}"
        
        return self.recognition_data[personnel_id]["image_path"]
    def _save_aggregated_data(self, personnel_id):
        data = self.recognition_data[personnel_id]
        avg_similarity = np.mean(data["similarities"])
        avg_emotion = max(set(data["emotions"]), key=data["emotions"].count)  # Most frequent emotion
        avg_gender = 0 if data["genders"].count(0) / len(data["genders"]) > 0.2 else max(set(data["genders"]), key=data["genders"].count)
        avg_age = np.min(data["ages"])

        log_record = {
            "timestamp": data["timestamps"][0],
            "label": data["label"],
            "similarity": round(float(avg_similarity), 2),
            "emotion": avg_emotion,
            "gender": avg_gender,
            "age": int(avg_age),
            "camera": data["camera_name"],
            "personnel_id": personnel_id,
            "image_path": data["image_path"]  # Save only the first image path
        }
        # print(log_record)
        notify_new_face(log_record)
        self.recognition_logs_collection.insert_one(log_record)
        print(f"Aggregated data saved for personnel_id: {personnel_id}")

        # Clear the stored data for this personnel_id
        del self.recognition_data[personnel_id]
    def _get_attributes(
        self, frame: np.ndarray, camera_name: str = None, spoofing: bool = False
    ) -> Tuple[
        List[np.ndarray], List[str], List[float], List[str], List[str], List[int]
    ]:
        if frame is None or len(frame.shape) < 2:
            return [], [], [], [], [], []

        # Detect faces using SCRFD
        bboxes, kpss = self.face_detector.detect(frame, input_size=(640, 640), max_num=49, thresh=0.7)
        if len(bboxes) == 0:
            return [], [], [], [], [], []

        labels, sims, emotions, ages, genders = [], [], [], [], []

        for idx, kps in enumerate(kpss):
            bbox = bboxes[idx]
            x1, y1, x2, y2 = map(int, bbox[:4])

            # Perform anti-spoofing check
            if self.anti_spoof:
                processed_frame, spoofing_label, spoofing_score, _ = self._perform_anti_spoofing_check(frame, bbox)

                # If the face is detected as fake, continue to the next detected face
                if spoofing_label != 1 or spoofing_score < 0.5:
                    frame = processed_frame
                    continue

            # Perform face recognition
            embedding = self.face_recognizer.get(frame, kps)
            min_dist = float("inf")
            best_match = None
            label = "Unknown"
            is_known = False   

            # Match the face embedding with the database
            for personnel_id in self.database.keys():
                db_embedding = self.database[personnel_id]['embedding']
                dist = np.linalg.norm(db_embedding - embedding)
                if dist < min_dist:
                    min_dist = dist
                    best_match = personnel_id

            sim = self.face_recognizer.compute_sim(embedding, self.database[best_match]['embedding'] if best_match else np.zeros_like(embedding))
            if sim >= self.similarity_threshold:
                label = self.database[best_match]['label']
                is_known = True
            elif sim < self.similarity_threshold and sim > 0.11:
                # It is likely that the face is known but the similarity is below the threshold
                pass
            else:
                # Handle unknown faces
                unknown_count = len([key for key in self.database.keys() if key.startswith("Unknown")])
                unknown_label = f"Unknown-{unknown_count + 1}"
                self.database[unknown_label] = {"embedding": embedding, "label": unknown_label}
                label = unknown_label
                is_known = False
                best_match = unknown_label

            # Append the results to the lists
            labels.append(label)
            sims.append(sim)

            # Get gender and age
            gender, age = self.gender_age_detector.get(frame, face=bbox)
            ages.append(age)
            genders.append("M" if gender == 1 else "F")

            # Detect emotion
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)  # Green color with thickness 2
            face_image = frame

            emotion = self.emotion_detector.detect_emotion_from_array(face_image)
            emotions.append(emotion)

            # Save and log the recognized face
            self._save_and_log_face(face_image, label, sim, emotion, gender, age, is_known, camera_name, personnel_id=best_match)

        return bboxes, labels, sims, emotions, genders, ages
    # def _get_attributes(
    #     self, frame: np.ndarray, camera_name: str = None, spoofing: bool = False
    # ) -> Tuple[
    #     List[np.ndarray], List[str], List[float], List[str], List[str], List[int]
    # ]:
    #     if frame is None or len(frame.shape) < 2:
    #         return [], [], [], [], [], []

    #     # Detect faces using SCRFD
    #     bboxes, kpss = self.face_detector.detect(frame, input_size=(640, 640), max_num=49, thresh=0.7)
    #     if len(bboxes) == 0:
    #         return [], [], [], [], [], []

    #     labels, sims, emotions, ages, genders = [], [], [], [], []

    #     for idx, kps in enumerate(kpss):
    #         bbox = bboxes[idx]
    #         x1, y1, x2, y2 = map(int, bbox[:4])

    #         # Perform anti-spoofing check
    #         if self.anti_spoof:
    #             processed_frame, spoofing_label, spoofing_score, _ = self._perform_anti_spoofing_check(frame, bbox)

    #             # If the face is detected as fake, continue to the next detected face
    #             if spoofing_label != 1 or spoofing_score < 0.5:
    #                 # print(f"Fake face detected with score: {spoofing_score:.2f}, skipping further processing.")
    #                 # cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)  # Draw red box
    #                 frame = processed_frame
    #                 continue

    #         # Perform face recognition
    #         embedding = self.face_recognizer.get(frame, kps)
    #         min_dist = float("inf")
    #         best_match = None
    #         label = "Unknown"
    #         is_known = False   

    #         # Match the face embedding with the database
    #         for personnel_id in self.database.keys():
    #             db_embedding = self.database[personnel_id]['embedding']
    #             dist = np.linalg.norm(db_embedding - embedding)
    #             if dist < min_dist:
    #                 min_dist = dist
    #                 best_match = personnel_id

    #         sim = self.face_recognizer.compute_sim(embedding, self.database[best_match]['embedding'] if best_match else np.zeros_like(embedding))
    #         if sim >= self.similarity_threshold:
    #             label = self.database[best_match]['label']
    #             is_known = True
    #         elif sim < self.similarity_threshold and sim > 0.2:
    #             # It is likely that the face is known but the similarity is below the threshold
    #             pass
    #         else:
    #             label = "Unknown"
    #             is_known = False
    #             best_match = None    
    #         # Append the results to the lists
    #         labels.append(label)
    #         sims.append(sim)

    #         # Get gender and age
    #         gender, age = self.gender_age_detector.get(frame, face=bbox)
    #         ages.append(age)
    #         genders.append("M" if gender == 1 else "F")

    #         # Detect emotion
    #         # face_image = frame[y1:y2, x1:x2]
    #         cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)  # Green color with thickness 2
    #         # cv2.putText(frame, f"{label} ({sim:.2f})", (x1, y1 - 5), cv2.FONT_HERSHEY_COMPLEX, 0.5, (0, 255, 0))
    #         face_image = frame

    #         emotion = self.emotion_detector.detect_emotion_from_array(face_image)
    #         emotions.append(emotion)

    #         # Save and log the recognized face
    #         self._save_and_log_face(face_image, label, sim, emotion, gender, age, is_known, camera_name, personnel_id=best_match)

    #     return bboxes, labels, sims, emotions, genders, ages

    def _perform_anti_spoofing_check(self, frame, bbox):
        # Extract coordinates from the bounding box
        x1, y1, x2, y2 = map(int, bbox[:4])
        face_image = frame[y1:y2, x1:x2]

        # Check if no face detected in the cropped area
        if face_image is None or face_image.size == 0:
            print("No face detected.")
            return frame, None, None, 0

        prediction = np.zeros((1, 3))
        test_speed = 0

        # Iterate through each anti-spoofing model in the directory
        model_dir = os.path.dirname(self.anti_spoofing_model_path)
        for model_name in os.listdir(model_dir):
            model_path = os.path.join(model_dir, model_name)
            h_input, w_input, model_type, scale = parse_model_name(model_name)
            param = {
                "org_img": frame,
                "bbox": bbox,
                "scale": scale,
                "out_w": w_input,
                "out_h": h_input,
                "crop": True,
            }
            if scale is None:
                param["crop"] = False
            
            # Crop the face image using the specified parameters
            img = self.image_cropper.crop(**param)
            
            # Start the timer and run the prediction
            start = time.time()
            prediction += self.anti_spoof_predictor.predict(img, model_path)
            test_speed += time.time() - start

        # Determine the label and score from the accumulated predictions
        label = np.argmax(prediction)
        value = prediction[0][label] / 2  # Adjust score if necessary
        
        # Set text and color based on prediction results
        if label == 1:
            result_text = None
            color = (0, 255, 0)
        else:
            result_text = "F-Score: {:.2f}".format(value)
            color = (0, 0, 255)  # Red for fake face

        # Draw the bounding box and label on the frame
        # cv2.rectangle(
        #     frame,
        #     (x1, y1),
        #     (x2, y2),
        #     color, 2)
        cv2.putText(
            frame,
            result_text,
            (x1, y1 - 5),
            cv2.FONT_HERSHEY_COMPLEX, 0.5 * frame.shape[0] / 1024, color)

        return frame, label, value, test_speed

    def recog_face_ip_cam(self, stream_id, camera: str, camera_name: str, is_recording=False):
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
                            *self._get_attributes(frame, camera_name)
                        ):
                            x1, y1, x2, y2 = map(int, bbox[:4])
                            if label == "Unknown":
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 4)  # Blue borders
                                text_label = f"{label}: {emotion}, gender: {gender}, age: {age}"
                                text_color = (255, 0, 0)  # Blue text
                            else:
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)  # Green borders
                                text_label = f"{label} ({sim * 100:.2f}%): {emotion}, gender: {gender}, age: {age}"
                                text_color = (0, 255, 0)  # Green text
                            cv2.putText(
                                frame,
                                text_label,
                                (x1 + 5, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.8,
                                text_color,
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

    def recog_face_local_cam(self, frame: np.ndarray, camera_name: str, is_recording: bool = False) -> str:
        self.stop_flag.clear()
        logging.info("Processing frame")

        if is_recording and self.video_writer is None:
            now = datetime.datetime.now()
            directory = "./records/"
            os.makedirs(directory, exist_ok=True)
            filename = directory + now.strftime("%H:%M:%S_%d/%m/%Y_yerel_kamera") + ".mp4"
            frame_height, frame_width = frame.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            self.video_writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))
            if not self.video_writer.isOpened():
                logging.error("Error initializing video writer")
                return ""

        for bbox, label, sim, emotion, gender, age in zip(*self._get_attributes(frame, camera_name)):
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
        
    def repair_last_record(self, filename: str):
        # records_folder = './records'
        # files = [os.path.join(records_folder, f) for f in os.listdir(records_folder) if os.path.isfile(os.path.join(records_folder, f))]
        # filename = max(files, key=os.path.getctime)

        # Define output file path
        output_file = filename.replace(".mp4", "_converted.mp4")

        # Execute ffmpeg command to convert video
        command = ["ffmpeg", "-i", filename, "-vcodec", "h264", "-acodec", "aac", output_file]

        # Run the command
        subprocess.run(command, capture_output=True, text=True)

        return output_file
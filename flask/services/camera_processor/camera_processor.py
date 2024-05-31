
import cv2
import numpy as np
import pandas as pd
import datetime
import os
import os.path as osp
from services.camera_processor.scrfd import SCRFD
from services.camera_processor.arcface_onnx import ArcFaceONNX
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
from PIL import Image
import onnxruntime
from services.camera_processor.enums.camera import Camera

class CameraProcessor:
    def __init__(self, device='cuda'):
        # Set the compute device
        self.device = torch.device(device)
        print(f"Using device: {self.device}")
        
        # Initialize ONNX Runtime settings
        onnxruntime.set_default_logger_severity(2)

        # Set the directory path for the models
        self.assets_dir = os.path.expanduser('~/.insightface/models/buffalo_l')
        
        # Initialize the SCRFD detector with the model file
        detector_path = os.path.join(self.assets_dir, 'det_10g.onnx')
        self.detector = SCRFD(detector_path)
        self.detector.prepare(0 if device=="cuda" else -1)
        
        # Initialize the ArcFace recognizer with the model file
        rec_path = os.path.join(self.assets_dir, 'w600k_r50.onnx')
        self.rec = ArcFaceONNX(rec_path)
        self.rec.prepare(0 if device=="cuda" else -1)
        
        # Initialize emotion classification model
        self.processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
        self.emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression").to(self.device)
        self.id_to_label = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}
        # Similarity threshold for face recognition
        self.similarity_threshold = 0.4
        # Load or create face database
        self.database = self.create_face_database(self.rec, self.detector, os.path.join(os.path.dirname(os.getcwd()),"face-images"))
     
        # Camera URLs file
        self.camera_urls_file = 'camera_urls.csv'



    def read_camera_urls(self):
        if not os.path.exists(self.camera_urls_file):
            return {}
        
        df = pd.read_csv(self.camera_urls_file, index_col=0)
        return df.to_dict()['url']

    def write_camera_urls(self,camera_urls):
        df = pd.DataFrame(list(camera_urls.items()), columns=['label', 'url'])
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
        """Process the cropped face image to classify emotion"""
        pil_image = Image.fromarray(face_image)
        processed_image = self.processor(pil_image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.emotion_model(**processed_image)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class = predictions.argmax().item()
            emotion = self.id_to_label[predicted_class]
        return emotion
    
    def recog_face_and_emotion(self, image):
        """Recognize faces and emotions in the given image"""
        bboxes, kpss = self.detector.autodetect(image, max_num=0)
        labels = []
        sims = []
        emotions = []
        embeddings = []
        for kps in kpss:
            embedding = self.rec.get(image, kps)
            embeddings.append(embedding)
        for idx, embedding in enumerate(embeddings):
            min_dist = float('inf')
            best_match = None
            for name, db_embedding in self.database.items():
                dist = np.linalg.norm(db_embedding - embedding)
                if dist < min_dist:
                    min_dist = dist
                    best_match = name
            sim = self.rec.compute_sim(embedding, self.database[best_match])
            labels.append(best_match if sim >= self.similarity_threshold else "Unknown")
            sims.append(sim)
            # Extract face region and recognize emotion
            bbox = bboxes[idx]
            x1, y1, x2, y2 = map(int, bbox[:4])
            face = image[y1:y2, x1:x2]
            if face.size > 0:
                emotion = self.get_emotion(face)
            else:
                emotion = "No Face Detected"
            emotions.append(emotion)
        return bboxes, labels, sims, emotions
    
    def generate(self, camera, is_recording=False):
        print(f"Opening camera stream: {camera}")
        cap = cv2.VideoCapture(camera)
        if not cap.isOpened():
            print("Error opening HTTP stream")
            return

        # Initialize video writer if recording is enabled
        writer = None
      
        if is_recording:
            # Get current date and time
            now = datetime.datetime.now()

            # Define the directory
            directory = "./records/"

            # Check if the directory exists, create it if it doesn't
            if not os.path.exists(directory):
                os.makedirs(directory)

            # Format as a string
            filename = directory + now.strftime("%H:%M:%S_%d.%m.%Y") + ".mp4"

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if is_recording and writer is None:
                # Initialize writer with the frame size of the first frame
                frame_height, frame_width = frame.shape[:2]
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))
                if not writer.isOpened():
                    print("Error initializing video writer")
                    break

            bboxes, labels, sims, emotions = self.recog_face_and_emotion(frame)
            for bbox, label, sim, emotion in zip(bboxes, labels, sims, emotions):
                x1, y1, x2, y2 = map(int, bbox[:4])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)
                text_label = f"{label} ({sim * 100:.2f}%): {emotion}"
                cv2.putText(frame, text_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            
            # Write the frame to the video file if recording
            if writer:
                writer.write(frame)
            
            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        
        cap.release()
        if writer:
            writer.release()
        
        
    def stream(self,stream_id,camera,quality, is_recording=False):
        camera_label = camera
        quality = quality
        camera = self.read_camera_urls()[camera_label] + quality
        return self.generate(camera, is_recording)

    def local_camera_stream(self, cam_id, quality="Quality"):
        cap = cv2.VideoCapture(cam_id)
        if not cap.isOpened():
            print("Error opening HTTP stream")
            return
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        # Set the JPEG quality level
        if quality == "Quality":
            jpeg_quality = 100
        if quality == "High":
            jpeg_quality = 90
        elif quality == "Medium":
            jpeg_quality = 50
        elif quality == "Low":
            jpeg_quality = 10
        else:
            jpeg_quality = 50

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality])
            if not ret:
                continue

            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

        cap.release()
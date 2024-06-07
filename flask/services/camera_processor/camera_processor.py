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
import uuid
from cv2.typing import MatLike
import logging
# from minivision.src.generate_patches import CropImage
# from minivision.src.anti_spoof_predict import AntiSpoofPredict


class CameraProcessor:
    def __init__(self, device="cuda"):
        # Set the compute device
        self.device = torch.device(device)
        print(f"Using device: {self.device}")
        # self.model_test = AntiSpoofPredict(0)

        # Initialize ONNX Runtime settings
        onnxruntime.set_default_logger_severity(3)

        # Set the directory path for the models
        self.assets_dir = os.path.expanduser("~/.insightface/models/")

        # Initialize the SCRFD detector with the model file
        detector_path = os.path.join(self.assets_dir, "buffalo_l/det_10g.onnx")
        self.detector = SCRFD(detector_path)
        self.detector.prepare(0 if device == "cuda" else -1)

        # Initialize the ArcFace recognizer with the model file
        rec_path = os.path.join(self.assets_dir, "buffalo_l/w600k_r50.onnx")
        self.rec = ArcFaceONNX(rec_path)
        self.rec.prepare(0 if device == "cuda" else -1)

        # Initialize emotion classification model
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
        # Similarity threshold for face recognition
        self.similarity_threshold = 0.4
        # Load or create face database
        self.database = self.create_face_database(
            self.rec,
            self.detector,
            os.path.join(os.path.dirname(os.getcwd()), "face-images"),
        )

        # Camera URLs file
        self.camera_urls_file = "camera_urls.csv"

        # Initialize log file
        self.log_file = "recognized_faces_log.csv"
        self.init_log_file()

        # Dictionary to track last recognition times
        self.last_recognitions = {}

        # Directory for unknown faces
        self.unknown_faces_dir = "unknown_faces"
        if not os.path.exists(self.unknown_faces_dir):
            os.makedirs(self.unknown_faces_dir)

    def init_log_file(self):
        # Initialize the log file with headers if it doesn't exist
        if not os.path.exists(self.log_file):
            df = pd.DataFrame(columns=["Timestamp", "Label", "Similarity", "Emotion"])
            df.to_csv(self.log_file, index=False)

    def log_recognition(self, label, similarity, emotion):
        # Log the recognized face with the current timestamp
        now = datetime.datetime.now()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

        # Check if this face was recognized recently
        if label in self.last_recognitions:
            last_recognition_time = self.last_recognitions[label]
            time_diff = (now - last_recognition_time).total_seconds()
            # Skip logging if recognized within the last 60 seconds
            if time_diff < 60:
                return

        # Update the last recognition time
        self.last_recognitions[label] = now

        # Append to log file
        df = pd.DataFrame(
            [[timestamp, label, similarity, emotion]],
            columns=["Timestamp", "Label", "Similarity", "Emotion"],
        )
        df.to_csv(self.log_file, mode="a", header=False, index=False)

    def compare_similarity(self, image1: MatLike, image2: MatLike):
        if image1 is None or image2 is None:
            return -1.0, "One or both images are None"

        if len(image1.shape) < 2 or len(image2.shape) < 2:
            return -1.0, "One or both images are not valid"

        bboxes1, kpss1 = self.detector.detect(
            image1,
            max_num=1,
            input_size=(128, 128),
            thresh=0.5,
            metric="max",
        )
        if bboxes1.shape[0] == 0:
            return -1.0, "Face not found in Image-1"

        bboxes2, kpss2 = self.detector.detect(
            image2,
            max_num=1,
            input_size=(128, 128),
            thresh=0.5,
            metric="max",
        )
        if bboxes2.shape[0] == 0:
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
        """Process the cropped face image to classify emotion"""
        pil_image = Image.fromarray(face_image)
        processed_image = self.processor(pil_image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.emotion_model(**processed_image)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class = predictions.argmax().item()
            emotion = self.id_to_label[predicted_class]
        return emotion

    def save_unknown_face(self, face_image, best_match):
        """Save the unknown face image with a unique ID"""
        # Get the current date and time
        now = datetime.datetime.now()
        # Format the date and time as a string
        timestamp = now.strftime("%Y%m%d-%H%M%S")
        # Create the filename
        filename = f"{best_match}-{timestamp}.jpg"

        # Create a new directory for the person
        person_dir = os.path.join(self.unknown_faces_dir, best_match)
        os.makedirs(person_dir, exist_ok=True)

        # Create the full file path
        file_path = os.path.join(person_dir, filename)

        # Save the image
        cv2.imwrite(file_path, face_image)
        return file_path

    def recog_face_and_emotion(self, image: MatLike):
        """Recognize faces and emotions in the given image"""
        if image is None:
            return [], [], [], []

        if len(image.shape) < 2:
            return [], [], [], []

        bboxes, kpss = self.detector.autodetect(image, max_num=49)

        if bboxes.shape[0] == 0:
            return [], [], [], []

        labels = []
        sims = []
        emotions = []
        embeddings = []
        for kps in kpss:
            embedding = self.rec.get(image, kps)
            embeddings.append(embedding)
        for idx, embedding in enumerate(embeddings):
            min_dist = float("inf")
            best_match = None
            label = "Unknown"
            for name, db_embedding in self.database.items():
                dist = np.linalg.norm(db_embedding - embedding)
                if dist < min_dist:
                    min_dist = dist
                    best_match = name
            sim = self.rec.compute_sim(embedding, self.database[best_match])
            if sim >= self.similarity_threshold:
                label = best_match
            elif sim >= 0.25:
                # Save the unknown face and assign a unique ID
                bbox = bboxes[idx]
                x1, y1, x2, y2 = map(int, bbox[:4])
                face_image = image[y1:y2, x1:x2]

                # Check similarity with previously saved unknown faces
                is_similar = False
                person_dir = os.path.join(self.unknown_faces_dir, best_match)
                if os.path.exists(person_dir):
                    for person_file in os.listdir(person_dir):
                        person_path = os.path.join(person_dir, person_file)
                        person_image = cv2.imread(person_path)
                        compare_sim, _ = self.compare_similarity(
                            face_image, person_image
                        )
                        # print(f"Similarity with {person_file}: {compare_sim}")
                        if compare_sim >= 0.2:
                            is_similar = True
                            label = f"Person-{person_file.split('-')[1].split('.')[0]}"
                            break
                else:
                    print(f"Directory {person_dir} does not exist.")

                if not is_similar:
                    self.save_unknown_face(face_image, best_match)
                    label = f"Unknown-{best_match}"
            else:

                # Save the unknown face and assign a unique ID
                bbox = bboxes[idx]
                x1, y1, x2, y2 = map(int, bbox[:4])
                face_image = image[y1:y2, x1:x2]

                # Save the unknown face under the "bilinmeyen" folder
                self.save_unknown_face(face_image, "bilinmeyen")
                label = (
                    f"bilinmeyen-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
                )

            labels.append(label)
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
            # Log the recognition
            self.log_recognition(label, sim, emotion)
        return bboxes, labels, sims, emotions

    def generate(self, stream_id, camera_label, quality="Quality", is_recording=False):
        camera = self.read_camera_urls()[camera_label]
        # camera = self.read_camera_urls()[camera_label] + quality
        logging.info(f"Opening camera stream: {camera}")

        try:
            # Try to convert the camera variable to an integer
            camera_int = int(camera)
            cap = cv2.VideoCapture(camera_int)
        except ValueError:
            # If the conversion fails, append the quality to the camera string
            cap = cv2.VideoCapture(camera + quality)

        print("Camera Opened:  " + str(cap.isOpened()))

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
                logging.error("Error reading frame")
                break
            if is_recording and writer is None:
                # Initialize writer with the frame size of the first frame
                frame_height, frame_width = frame.shape[:2]
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(
                    filename, fourcc, 20.0, (frame_width, frame_height)
                )
                if not writer.isOpened():
                    logging.error("Error initializing video writer")
                    break

            bboxes, labels, sims, emotions = self.recog_face_and_emotion(frame)
            for bbox, label, sim, emotion in zip(bboxes, labels, sims, emotions):
                x1, y1, x2, y2 = map(int, bbox[:4])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)
                text_label = f"{label} ({sim * 100:.2f}%): {emotion}"
                cv2.putText(
                    frame,
                    text_label,
                    (x1 + 5, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2,
                )

            # Write the frame to the video file if recording
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
        logging.info('Finished generate function')
    # def stream(self, stream_id, camera, quality, is_recording=False):
    #     camera_label = camera
    #     quality = quality
    #     camera = self.read_camera_urls()[camera_label] + quality
    #     print(camera)
    #     return self.generate(camera, is_recording)



    # def local_camera_stream(self, cam_id, quality="Quality"):
    #     logging.info('Starting local_camera_stream function with cam_id: %s and quality: %s', cam_id, quality)
    #     cap = cv2.VideoCapture(cam_id)
    #     if not cap.isOpened():
    #         logging.error('Error opening HTTP stream')
    #         return
    #     cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    #     cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    #     # Set the JPEG quality level
    #     if quality == "Quality":
    #         jpeg_quality = 100
    #     elif quality == "Balanced":
    #         jpeg_quality = 90
    #     elif quality == "Bandwidth":
    #         jpeg_quality = 50
    #     elif quality == "Mobile":
    #         jpeg_quality = 10
    #     else:
    #         jpeg_quality = 50

    #     while True:
    #         ret, frame = cap.read()
    #         if not ret:
    #             logging.error('Error reading frame')
    #             break

    #         ret, buffer = cv2.imencode(
    #             ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality]
    #         )
    #         if not ret:
    #             logging.error('Error encoding frame')
    #             continue

    #         yield (
    #             b"--frame\r\n"
    #             b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\r"
    #         )

    #     cap.release()
    #     logging.info('Finished local_camera_stream function')

    # def liveness_detector(self,frame):
    #     image_cropper = CropImage()
    #     model_dir = '../../resources/liveness_model'

    #     image_bbox = self.model_test.get_bbox(frame)
    #     if image_bbox[0] == 0 and image_bbox[1] == 0 and image_bbox[2] == 1 and image_bbox[3] == 1:
    #         return False
    #     prediction = np.zeros((1, 3))
    #     test_speed = 0
    #     # sum the prediction from single model's result
    #     for model_name in os.listdir(model_dir):
    #         h_input, w_input, model_type, scale = parse_model_name(model_name)
    #         param = {
    #             "org_img": frame,
    #             "bbox": image_bbox,
    #             "scale": scale,
    #             "out_w": w_input,
    #             "out_h": h_input,
    #             "crop": True,
    #         }
    #         if scale is None:
    #             param["crop"] = False
    #         img = image_cropper.crop(**param)
    #         prediction += self.model_test.predict(img, os.path.join(model_dir, model_name))

    #     # label: face is true or fake
    #     label = np.argmax(prediction)
    #     # value: the score of prediction
    #     value = prediction[0][label]
    #     if label == 1 and value > 0.7:
    #         return True
    #     else:
    #         return False


# import cv2
# import numpy as np
# import pandas as pd
# import datetime
# import os
# import os.path as osp
# from services.camera_processor.scrfd import SCRFD
# from services.camera_processor.arcface_onnx import ArcFaceONNX
# from transformers import AutoModelForImageClassification, AutoImageProcessor
# import torch
# from PIL import Image
# import onnxruntime
# from services.camera_processor.enums.camera import Camera
# import uuid

# class CameraProcessor:
#     def __init__(self, device='cuda'):
#         # Set the compute device
#         self.device = torch.device(device)
#         print(f"Using device: {self.device}")

#         # Initialize ONNX Runtime settings
#         onnxruntime.set_default_logger_severity(2)

#         # Set the directory path for the models
#         self.assets_dir = os.path.expanduser('~/.insightface/models/buffalo_l')

#         # Initialize the SCRFD detector with the model file
#         detector_path = os.path.join(self.assets_dir, 'det_10g.onnx')
#         self.detector = SCRFD(detector_path)
#         self.detector.prepare(0 if device=="cuda" else -1)

#         # Initialize the ArcFace recognizer with the model file
#         rec_path = os.path.join(self.assets_dir, 'w600k_r50.onnx')
#         self.rec = ArcFaceONNX(rec_path)
#         self.rec.prepare(0 if device=="cuda" else -1)

#         # Initialize emotion classification model
#         self.processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
#         self.emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression").to(self.device)
#         self.id_to_label = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}
#         # Similarity threshold for face recognition
#         self.similarity_threshold = 0.4
#         # Load or create face database
#         self.database = self.create_face_database(self.rec, self.detector, os.path.join(os.path.dirname(os.getcwd()),"face-images"))

#         # Camera URLs file
#         self.camera_urls_file = 'camera_urls.csv'

#         # Initialize log file
#         self.log_file = 'recognized_faces_log.csv'
#         self.init_log_file()

#         # Dictionary to track last recognition times
#         self.last_recognitions = {}

#         # Directory for unknown faces
#         self.unknown_faces_dir = 'unknown_faces'
#         if not os.path.exists(self.unknown_faces_dir):
#             os.makedirs(self.unknown_faces_dir)

#     def init_log_file(self):
#         # Initialize the log file with headers if it doesn't exist
#         if not os.path.exists(self.log_file):
#             df = pd.DataFrame(columns=['Timestamp', 'Label', 'Similarity', 'Emotion'])
#             df.to_csv(self.log_file, index=False)

#     def log_recognition(self, label, similarity, emotion):
#         # Log the recognized face with the current timestamp
#         now = datetime.datetime.now()
#         timestamp = now.strftime('%Y-%m-%d %H:%M:%S')

#         # Check if this face was recognized recently
#         if label in self.last_recognitions:
#             last_recognition_time = self.last_recognitions[label]
#             time_diff = (now - last_recognition_time).total_seconds()
#             # Skip logging if recognized within the last 60 seconds
#             if time_diff < 60:
#                 return

#         # Update the last recognition time
#         self.last_recognitions[label] = now

#         # Append to log file
#         df = pd.DataFrame([[timestamp, label, similarity, emotion]], columns=['Timestamp', 'Label', 'Similarity', 'Emotion'])
#         df.to_csv(self.log_file, mode='a', header=False, index=False)

#     def similarity(self, args):
#         image1 = cv2.imread(args.img1)
#         image2 = cv2.imread(args.img2)
#         bboxes1, kpss1 = self.detector.autodetect(image1, max_num=1)
#         if bboxes1.shape[0]==0:
#             return -1.0, "Face not found in Image-1"
#         bboxes2, kpss2 = self.detector.autodetect(image2, max_num=1)
#         if bboxes2.shape[0]==0:
#             return -1.0, "Face not found in Image-2"
#         kps1 = kpss1[0]
#         kps2 = kpss2[0]
#         feat1 = self.rec.get(image1, kps1)
#         feat2 = self.rec.get(image2, kps2)
#         sim = self.rec.compute_sim(feat1, feat2)
#         if sim<0.2:
#             conclu = 'They are NOT the same person'
#         elif sim>=0.2 and sim<0.28:
#             conclu = 'They are LIKELY TO be the same person'
#         else:
#             conclu = 'They ARE the same person'
#         return sim, conclu

#     def read_camera_urls(self):
#         if not os.path.exists(self.camera_urls_file):
#             return {}

#         df = pd.read_csv(self.camera_urls_file, index_col=0)
#         return df.to_dict()['url']

#     def write_camera_urls(self,camera_urls):
#         df = pd.DataFrame(list(camera_urls.items()), columns=['label', 'url'])
#         df.to_csv(self.camera_urls_file, index=False)

#     def create_face_database(self, model, face_detector, image_folder):
#         database = {}
#         for filename in os.listdir(image_folder):
#             if filename.endswith((".jpg", ".png")):
#                 name = osp.splitext(filename)[0]
#                 image_path = osp.join(image_folder, filename)
#                 image = cv2.imread(image_path)
#                 bboxes, kpss = face_detector.autodetect(image, max_num=1)
#                 if bboxes.shape[0] > 0:
#                     kps = kpss[0]
#                     embedding = model.get(image, kps)
#                     database[name] = embedding
#         return database

#     def get_emotion(self, face_image):
#         """Process the cropped face image to classify emotion"""
#         pil_image = Image.fromarray(face_image)
#         processed_image = self.processor(pil_image, return_tensors="pt").to(self.device)
#         with torch.no_grad():
#             outputs = self.emotion_model(**processed_image)
#             predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
#             predicted_class = predictions.argmax().item()
#             emotion = self.id_to_label[predicted_class]
#         return emotion

#     def save_unknown_face(self, face_image):
#         """Save the unknown face image with a unique ID"""
#         unique_id = str(uuid.uuid4())
#         file_path = os.path.join(self.unknown_faces_dir, f"{unique_id}.jpg")
#         cv2.imwrite(file_path, face_image)
#         return unique_id

#     def recog_face_and_emotion(self, image):
#         """Recognize faces and emotions in the given image"""
#         bboxes, kpss = self.detector.autodetect(image, max_num=0)
#         labels = []
#         sims = []
#         emotions = []
#         embeddings = []
#         for kps in kpss:
#             embedding = self.rec.get(image, kps)
#             embeddings.append(embedding)
#         for idx, embedding in enumerate(embeddings):
#             min_dist = float('inf')
#             best_match = None
#             for name, db_embedding in self.database.items():
#                 dist = np.linalg.norm(db_embedding - embedding)
#                 if dist < min_dist:
#                     min_dist = dist
#                     best_match = name
#             sim = self.rec.compute_sim(embedding, self.database[best_match])
#             if sim >= self.similarity_threshold:
#                 label = best_match
#             else:
#                 # Save the unknown face and assign a unique ID
#                 bbox = bboxes[idx]
#                 x1, y1, x2, y2 = map(int, bbox[:4])
#                 face_image = image[y1:y2, x1:x2]
#                 unique_id = self.save_unknown_face(face_image)
#                 label = f"Unknown_{unique_id}"
#             labels.append(label)
#             sims.append(sim)
#             # Extract face region and recognize emotion
#             bbox = bboxes[idx]
#             x1, y1, x2, y2 = map(int, bbox[:4])
#             face = image[y1:y2, x1:x2]
#             if face.size > 0:
#                 emotion = self.get_emotion(face)
#             else:
#                 emotion = "No Face Detected"
#             emotions.append(emotion)
#             # Log the recognition
#             self.log_recognition(label, sim, emotion)
#         return bboxes, labels, sims, emotions

#     def generate(self, camera, is_recording=False):
#         print(f"Opening camera stream: {camera}")
#         cap = cv2.VideoCapture(camera)
#         if not cap.isOpened():
#             print("Error opening HTTP stream")
#             return

#         # Initialize video writer if recording is enabled
#         writer = None

#         if is_recording:
#             # Get current date and time
#             now = datetime.datetime.now()

#             # Define the directory
#             directory = "./records/"

#             # Check if the directory exists, create it if it doesn't
#             if not os.path.exists(directory):
#                 os.makedirs(directory)

#             # Format as a string
#             filename = directory + now.strftime("%H:%M:%S_%d.%m.%Y") + ".mp4"

#         while True:
#             ret, frame = cap.read()
#             if not ret:
#                 break

#             if is_recording and writer is None:
#                 # Initialize writer with the frame size of the first frame
#                 frame_height, frame_width = frame.shape[:2]
#                 fourcc = cv2.VideoWriter_fourcc(*'mp4v')
#                 writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))
#                 if not writer.isOpened():
#                     print("Error initializing video writer")
#                     break

#             bboxes, labels, sims, emotions = self.recog_face_and_emotion(frame)
#             for bbox, label, sim, emotion in zip(bboxes, labels, sims, emotions):
#                 x1, y1, x2, y2 = map(int, bbox[:4])
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 4)
#                 text_label = f"{label} ({sim * 100:.2f}%): {emotion}"
#                 cv2.putText(frame, text_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

#             # Write the frame to the video file if recording
#             if writer:
#                 writer.write(frame)

#             _, buffer = cv2.imencode('.jpg', frame)
#             yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

#         cap.release()
#         if writer:
#             writer.release()


#     def stream(self,stream_id,camera,quality, is_recording=False):
#         camera_label = camera
#         quality = quality
#         camera = self.read_camera_urls()[camera_label] + quality
#         return self.generate(camera, is_recording)

#     def local_camera_stream(self, cam_id, quality="Quality"):
#         cap = cv2.VideoCapture(cam_id)
#         if not cap.isOpened():
#             print("Error opening HTTP stream")
#             return
#         cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
#         cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

#         # Set the JPEG quality level
#         if quality == "Quality":
#             jpeg_quality = 100
#         if quality == "High":
#             jpeg_quality = 90
#         elif quality == "Medium":
#             jpeg_quality = 50
#         elif quality == "Low":
#             jpeg_quality = 10
#         else:
#             jpeg_quality = 50

#         while True:
#             ret, frame = cap.read()
#             if not ret:
#                 break

#             ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality])
#             if not ret:
#                 continue

#             yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

#         cap.release()

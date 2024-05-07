from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import StreamingResponse
import numpy as np
import cv2
import os
from scrfd import SCRFD
from arcface_onnx import ArcFaceONNX
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
from PIL import Image
import onnxruntime
import asyncio
from typing import List
import base64
import zmq
import os.path as osp

IMAGE_FOLDER = '../face-images/' # Face image folder path
SIMILARITY_THRESHOLD = 0.4  # Adjust this threshold as needed
# Map the emotion label index to the corresponding emotion
ID_TO_LABEL = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}

app = FastAPI()
onnxruntime.set_default_logger_severity(3)

# Assuming you have already prepared your model assets in the ~/.insightface/models/buffalo_sc directory.
assets_dir = os.path.expanduser('~/.insightface/models/buffalo_sc')
detector_model_path = os.path.join(assets_dir, 'det_500m.onnx')
recognition_model_path = os.path.join(assets_dir, 'w600k_mbf.onnx')

detector = SCRFD(detector_model_path)
detector.prepare(-1)  # GPU ID 0; use -1 for CPU
recognition = ArcFaceONNX(recognition_model_path)
recognition.prepare(-1)  # GPU ID 0; use -1 for CPU

processor = AutoImageProcessor.from_pretrained("trpakov/vit-face-expression")
emotion_model = AutoModelForImageClassification.from_pretrained("trpakov/vit-face-expression")

# ZeroMQ Context
context = zmq.Context()
footage_socket = context.socket(zmq.SUB)
footage_socket.connect('tcp://10.15.95.233:5555')
footage_socket.setsockopt_string(zmq.SUBSCRIBE, str(''))


# This dictionary will store the face database in memory
face_database = {}

async def create_face_database_async(model, face_detector, image_folder: str):
    global face_database  # Declare to modify the global variable
    
    async def process_image(filename):
        name = osp.splitext(filename)[0]
        image_path = osp.join(image_folder, filename)
        image = await asyncio.to_thread(cv2.imread, image_path)
        bboxes, kpss = await asyncio.to_thread(face_detector.autodetect, image, max_num=1)
        if bboxes.shape[0] > 0:
            kps = kpss[0]
            embedding = await asyncio.to_thread(model.get, image, kps)
            face_database[name] = embedding  # Update the global variable directly

    tasks = [process_image(filename) for filename in os.listdir(image_folder) if filename.endswith((".jpg", ".png"))]
    await asyncio.gather(*tasks)



async def decode_image_async(encoded_image):
    def decode_sync(encoded_image):
        image_data = base64.b64decode(encoded_image)
        nparr = np.frombuffer(image_data, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    return await asyncio.to_thread(decode_sync, encoded_image)


async def recog_face_async(image, database=face_database):
    # Run the face detection in a thread to prevent blocking the asyncio event loop
    bboxes, kpss = await asyncio.to_thread(detector.autodetect, image, max_num=0)
    
    labels = []
    sims = []
    embeddings = []

    # Process each detected face in parallel using asyncio.gather
    async def process_kps(kps):
        embedding = await asyncio.to_thread(recognition.get, image, kps)
        embeddings.append(embedding)

    # Wait for all face embeddings to be calculated
    await asyncio.gather(*(process_kps(kps) for kps in kpss))

    # Now, compute the similarity of each embedding against the database
    # This part can also be run in parallel if necessary, but given the likely
    # computational complexity, running it directly on the event loop might be sufficient.
    # For very large databases or more complex similarity metrics, consider offloading to a thread.
    for embedding in embeddings:
        min_dist = float('inf')
        best_match = None
        for name, db_embedding in database.items():
            dist = np.linalg.norm(db_embedding - embedding)
            if dist < min_dist:
                min_dist = dist
                best_match = name
        sim = recognition.compute_sim(embedding, database[best_match])
        labels.append(best_match if sim >= SIMILARITY_THRESHOLD else "Unknown")
        sims.append(sim)

    return bboxes, labels, sims



async def detect_emotion_async(image):
    def detect_emotion_sync(image):
        # Resize the image to a smaller size
        image = cv2.resize(image, (224, 224))

        color_converted = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(color_converted)
        inputs = processor(images=pil_image, return_tensors="pt")

        # Move the inputs to the GPU if available
        if torch.cuda.is_available():
            inputs = {name: tensor.to('cuda') for name, tensor in inputs.items()}

        outputs = emotion_model(**inputs)
        probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
        top_prob, top_class_id = probabilities.topk(1, dim=-1)
        predicted_label = ID_TO_LABEL[int(top_class_id.item())]  # Ensure id_to_label is accessible
        predicted_probability = top_prob.item()
        return predicted_label, predicted_probability

    return await asyncio.to_thread(detect_emotion_sync, image)

# async def detect_emotion_batch_async(images):
#     def detect_emotion_sync_batch(images):
#         batch = images
     
        
#         inputs = processor(images=batch, return_tensors="pt")
        
#         if torch.cuda.is_available():
#             inputs = {name: tensor.to('cuda') for name, tensor in inputs.items()}
        
#         outputs = emotion_model(**inputs)
#         probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
#         top_probs, top_class_ids = probabilities.topk(1, dim=-1)

#         results = []
#         for top_prob, top_class_id in zip(top_probs, top_class_ids):
#             predicted_label = ID_TO_LABEL[int(top_class_id.item())]
#             predicted_probability = top_prob.item()
#             results.append((predicted_label, predicted_probability))
        
#         return results

#     return await asyncio.to_thread(detect_emotion_sync_batch, images)



import datetime  # For adding timestamps

frame_count = 0
emotion_label = ""
emotion_probability = 0.0

# Your existing async function with modifications
async def streamer_async(database=face_database):
    global frame_count, emotion_label, emotion_probability
    frame_count += 1

    frame = await asyncio.to_thread(footage_socket.recv_string)
    image = await decode_image_async(frame)

    bboxes, face_labels, sims = await recog_face_async(image, database)
    
    for bbox, face_label, sim in zip(bboxes, face_labels, sims):
        x1, y1, x2, y2 = map(int, bbox[:4])
        # Extract the face region as needed for emotion detection (this might need adjustment)
        face = image[y1:y2, x1:x2]

        if frame_count % 30 == 0:
            if face.size == 0:
                continue
            emotion_label, emotion_probability = await detect_emotion_async(face)
            frame_count = 0  # Consider moving this outside the loop
        else:
            if emotion_label == "" and emotion_probability == 0.0:
                pass

        # Drawing and labeling operations, now including time
        current_time = datetime.datetime.now().strftime("%H:%M:%S")
        cv2.rectangle(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
        text_face_label = f"{face_label} ({sim * 100:.2f}%) {current_time}"
        text_emotion = f"{emotion_label} ({emotion_probability * 100:.2f}%)"
        cv2.putText(image, text_face_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
        cv2.putText(image, text_emotion, (x1 + 5, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

    source = cv2.imencode('.jpg', image)[1].tobytes()
    return source


# frame_count = 0
# emotion_label = ""
# emotion_probability = 0.0
# async def streamer_async(database=face_database):
#     global frame_count, emotion_label, emotion_probability
#     # Increment frame counter
#     frame_count += 1
    
#     frame = await asyncio.to_thread(footage_socket.recv_string)
#     image = await decode_image_async(frame)

#     bboxes, labels, sims = await recog_face_async(image, database)
    
#     for bbox, label, sim in zip(bboxes, labels, sims):
#         x1, y1, x2, y2 = map(int, bbox[:4])

#         if  frame_count % 30 == 0:
#             # Detect emotion every 30th frame or if the face is not in the cache
#             face = image[y1:y2, x1:x2]
#             if face.size == 0:
#                 continue  # Skip if the face region is empty
            
#             emotion_label, emotion_probability = await detect_emotion_async(face)
#             frame_count = 0  # Reset frame counter
#         else:
#             if emotion_label == "" and emotion_probability == 0.0:
#                 pass
        
#         # Drawing and labeling operations
#         cv2.rectangle(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
#         text_label = f"{label} ({sim * 100:.2f}%)"
#         text_emotion = f"{emotion_label} ({emotion_probability * 100:.2f}%)"
#         cv2.putText(image, text_label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
#         cv2.putText(image, text_emotion, (x1 + 5, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

#     source = cv2.imencode('.jpg', image)[1].tobytes()
#     return source


# async def streamer_async(database=face_database):
#     # Receive the frame asynchronously if possible. If your socket library doesn't support
#     # async, you'll need to wrap it with asyncio.to_thread or use an async alternative.
#     frame = await asyncio.to_thread(footage_socket.recv_string)
    
#     # Decode the image asynchronously
#     image = await decode_image_async(frame)  # Ensure decode_image_async is defined as shown previously
    
#     # Recognize faces asynchronously
#     bboxes, labels, sims = await recog_face_async(image, database)  # Ensure recog_face_async is defined
    
#     for bbox, label, sim in zip(bboxes, labels, sims):
#         x1, y1, x2, y2 = map(int, bbox[:4])
#         face = image[y1:y2, x1:x2]
#         if face.size == 0:
#             continue
        
#         # Detect emotion asynchronously
#         emotion_label, emotion_probability = await detect_emotion_async(face)  # Ensure detect_emotion_async is defined
        
#         # Drawing operations (remain synchronous as they are CPU-bound and quick)
#         cv2.rectangle(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
#         text_label = f"{label} ({sim * 100:.2f}%)"
#         text_emotion = f"{emotion_label} ({emotion_probability * 100:.2f}%)"
#         cv2.putText(image, f"{text_label}", (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
#         cv2.putText(image, f"{text_emotion}", (x1 + 5, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

#     # Encode the modified image
#     source = cv2.imencode('.jpg', image)[1].tobytes()
#     return source



async def generate():
    while True:
        frame = await streamer_async()  # Use the async version of streamer
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.get("/")
async def index():
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.on_event("startup")
async def startup_event():
    global face_database  # Reference the global database variable if needed
    global recognition, detector
    # Assuming `model` and `face_detector` are already initialized and available here
    face_database = await create_face_database_async(recognition, detector, IMAGE_FOLDER)
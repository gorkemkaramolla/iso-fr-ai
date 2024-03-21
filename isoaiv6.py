import cv2
import face_recognition
import numpy as np
import os
import math
from glob import glob
import concurrent.futures

def sigmoid_confidence(distance, steepness=10):
    return 1 / (1 + math.exp(steepness * (distance - 0.5)))

def load_face_encodings(base_dir):
    person_face_encodings = {}
    for person_name in os.listdir(base_dir):
        person_dir = os.path.join(base_dir, person_name)
        if os.path.isdir(person_dir):
            encodings = []
            for image_file in glob(os.path.join(person_dir, '*.jpg')):
                image = face_recognition.load_image_file(image_file)
                face_encoding = face_recognition.face_encodings(image)
                if face_encoding:  # If a face is detected
                    encodings.append(face_encoding[0])
            if encodings:
                person_face_encodings[person_name] = encodings
    return person_face_encodings

def recognize_face(face_encoding, all_face_encodings, all_face_names):
    tolerance = 0.75  # Adjust based on testing
    distances = face_recognition.face_distance(all_face_encodings, face_encoding)
    best_match_index = np.argmin(distances) if distances.size > 0 else None
    if best_match_index is not None and distances[best_match_index] <= tolerance:
        name = all_face_names[best_match_index]
        confidence = sigmoid_confidence(distances[best_match_index])
        return f'{name} ({confidence:.2%})'
    return "Unknown"

def batch_recognize_faces(face_encodings, all_face_encodings, all_face_names):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = executor.map(recognize_face, face_encodings, [all_face_encodings]*len(face_encodings), [all_face_names]*len(face_encodings))
    return list(results)

# Load encodings
base_dir = "face-images/"
person_face_encodings = load_face_encodings(base_dir)
all_face_encodings = [enc for sublist in person_face_encodings.values() for enc in sublist]
all_face_names = [name for name, encodings in person_face_encodings.items() for _ in encodings]

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
video_capture = cv2.VideoCapture(0)

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("Unable to capture video")
        break

    rgb_frame = frame[:, :, ::-1]
    scaleFactor = 1.05
    minNeighbors = 3
    minSize = (30, 30)
    faces = face_cascade.detectMultiScale(rgb_frame, scaleFactor=scaleFactor, minNeighbors=minNeighbors, minSize=minSize)

    face_encodings = [face_recognition.face_encodings(rgb_frame[y:y+h, x:x+w])[0] for (x, y, w, h) in faces if face_recognition.face_encodings(rgb_frame[y:y+h, x:x+w])]
    
    # Recognize all faces in the current batch
    face_names = batch_recognize_faces(face_encodings, all_face_encodings, all_face_names)

    # Draw rectangles and names around detected faces
    for ((x, y, w, h), name) in zip(faces, face_names):
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
        cv2.rectangle(frame, (x, y+h+35), (x+w, y+h), (0, 0, 255), cv2.FILLED)
        font = cv2.FONT_HERSHEY_DUPLEX
        cv2.putText(frame, name, (x + 6, y+h + 30), font, 1.0, (255, 255, 255), 1)

    cv2.imshow('Video', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()

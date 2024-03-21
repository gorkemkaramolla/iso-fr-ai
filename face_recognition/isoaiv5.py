import cv2
import face_recognition
import numpy as np
import os
import math
from glob import glob
import concurrent.futures
# ISO AI v5 with face recognition library and OpenCV. 
# Use parallel processing to recognize faces in real-time video stream.

# Load multiple images per person and generate face encodings
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
                if face_encoding:  # If face is detected
                    encodings.append(face_encoding[0])
            if encodings:
                person_face_encodings[person_name] = encodings
    return person_face_encodings

person_face_encodings = load_face_encodings("face-images/")
all_face_encodings = [enc for sublist in person_face_encodings.values() for enc in sublist]
all_face_names = [name for name, encodings in person_face_encodings.items() for _ in encodings]

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
video_capture = cv2.VideoCapture(0)

# Function to recognize a single face
def recognize_face(face_encoding):
    tolerance = 0.25  # Adjust as needed
    distances = face_recognition.face_distance(all_face_encodings, face_encoding)
    best_match_index = np.argmin(distances) if distances.size > 0 else None
    if best_match_index is not None and distances[best_match_index] <= tolerance:
        name = all_face_names[best_match_index]
        confidence = sigmoid_confidence(distances[best_match_index])
        return f'{name} ({confidence:.2%})'
    return "Unknown"

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("Unable to capture video")
        break

    rgb_frame = frame[:, :, ::-1]
    scaleFactor = 1.1
    minNeighbors = 5
    minSize = (30, 30)
    faces = face_cascade.detectMultiScale(rgb_frame, scaleFactor=scaleFactor, minNeighbors=minNeighbors, minSize=minSize)
    
    # Extract face encodings in parallel
    face_encodings = [face_recognition.face_encodings(rgb_frame[y:y+h, x:x+w])[0] for (x, y, w, h) in faces if face_recognition.face_encodings(rgb_frame[y:y+h, x:x+w])]
    
    # Recognize faces in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        face_names = list(executor.map(recognize_face, face_encodings))

    # Drawing the results
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

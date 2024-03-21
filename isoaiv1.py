import cv2
import face_recognition
import numpy as np
from glob import glob
import os
import math
# ISO AI v1 with face recognition library and OpenCV. It uses the face_recognition library to recognize faces in images and videos.
# It can accept multiple images for a person. To recognize the person more accuartly it uses the sigmoid function to calculate the confidence.

# Directory where images are stored, organized by person name
base_dir = "face-images/"

# Load multiple images per person and generate face encodings
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

# Compute confidence based on distance
def sigmoid_confidence(distance, steepness=10):
    return 1 / (1 + math.exp(steepness * (distance - 0.5)))

# Initialize variables and load face encodings
person_face_encodings = load_face_encodings(base_dir)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
# video_capture = cv2.VideoCapture(0)
video_capture = cv2.VideoCapture("video2.mp4")

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("Unable to capture video")
        break

    rgb_frame = frame[:, :, ::-1]
    faces = face_cascade.detectMultiScale(rgb_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    face_names = []

    for (x, y, w, h) in faces:
        roi = rgb_frame[y:y+h, x:x+w]
        face_encoding = face_recognition.face_encodings(roi)
        if face_encoding:
            face_encoding = face_encoding[0]
            name = "Unknown"
            lowest_distance = None

            for person_name, encodings in person_face_encodings.items():
                distances = face_recognition.face_distance(encodings, face_encoding)
                if distances.size > 0:
                    min_distance = np.min(distances)
                    if lowest_distance is None or min_distance < lowest_distance:
                        lowest_distance = min_distance
                        name = person_name
            
            if lowest_distance is not None:
                confidence = sigmoid_confidence(lowest_distance)
                name += f' ({confidence:.2%})'
            
            face_names.append(name)

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

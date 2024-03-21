import cv2
import face_recognition
import numpy as np
import os
import math
from glob import glob
# ISO AI v3 with face recognition library and OpenCV. 
# Fine-tune parameters for face detection and recognition.

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

# Initialize variables and load face encodings
person_face_encodings = load_face_encodings("face-images/")
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
video_capture = cv2.VideoCapture(0)

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("Unable to capture video")
        break

    rgb_frame = frame[:, :, ::-1]

    # Fine-tune these parameters to improve your face detection accuracy
    scaleFactor = 1.1  # Experiment with this value, e.g., 1.05 to 1.5
    minNeighbors = 5   # Experiment with this value, e.g., 3 to 6
    minSize = (30, 30) # Minimum size of the detected face


   
    faces = face_cascade.detectMultiScale(rgb_frame, scaleFactor=scaleFactor, minNeighbors=minNeighbors, minSize=minSize)
    face_names = []

    # Face recognition and drawing part remains the same
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

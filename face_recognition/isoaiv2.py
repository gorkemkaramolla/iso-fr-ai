import cv2
import face_recognition
import numpy as np
from glob import glob
import os
from mtcnn import MTCNN
import math
# ISO AI v2 with face recognition library and OpenCV. 
# Added MTCNN for face detection.

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

# Function to get face locations using MTCNN
def get_face_locations(image):
    detector = MTCNN()
    result = detector.detect_faces(image)
    face_locations = []
    for face in result:
        x, y, width, height = face['box']
        face_locations.append((y, x+width, y+height, x))
    return face_locations

# Initialize variables and load face encodings
person_face_encodings = load_face_encodings(base_dir)
video_capture = cv2.VideoCapture(1)

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("Unable to capture video")
        break

    rgb_frame = frame[:, :, ::-1]
    faces = get_face_locations(rgb_frame)
    face_names = []

    for top, right, bottom, left in faces:
        # Adjust the frame for face recognition processing
        face_frame = rgb_frame[top:bottom, left:right]
        face_encodings = face_recognition.face_encodings(face_frame)
        if face_encodings:
            face_encoding = face_encodings[0]
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

    # Draw rectangles and names for detected faces
    for ((top, right, bottom, left), name) in zip(faces, face_names):
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
        font = cv2.FONT_HERSHEY_DUPLEX
        cv2.putText(frame, name, (left + 6, bottom - 6), font, 0.5, (255, 255, 255), 1)

    cv2.imshow('Video', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()


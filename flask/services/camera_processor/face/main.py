# main.py

import cv2
import numpy as np
import os
from face_detection import FaceDetection
from gender_age_detection import GenderAgeDetection
from face_recognition import FaceRecognition

if __name__ == "__main__":
    directory = "../../../../face-images"

    img_path = "../../../../face-images/kilise.jpeg"
    img = cv2.imread(img_path)

    # Face Recognition Example
    face_detector = FaceDetection()
    face_recognizer = FaceRecognition()
    age_and_gender_recognizer = GenderAgeDetection()
    featured_face_path = "../../../../face-images/FatihYavuz.jpg"
    featured_face_img = cv2.imread(featured_face_path)
    if img is not None and featured_face_img is not None:
        recognized_faces = face_recognizer.recognize_faces(img, featured_face_img)

        annotated_img = face_detector.draw_faces(img)
        annotated_img = face_recognizer.draw_recognized_faces(img, recognized_faces)
        annotated_img = age_and_gender_recognizer.draw_age_and_gender(annotated_img)
        cv2.imshow("Face Recognition", annotated_img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    else:
        print(f"Could not load image: {img_path} or {featured_face_path}")

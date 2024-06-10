# main.py

# import cv2
# import numpy as np
# import os
# from face_detection import FaceDetection
# from gender_age_detection import GenderAgeDetection
# from face_recognition import FaceRecognition

# if __name__ == "__main__":
#     directory = "../../../../face-images"

#     img_path = "../../../../face-images/kilise.jpeg"
#     img = cv2.imread(img_path)

#     # Face Recognition Example
#     face_detector = FaceDetection()
#     face_recognizer = FaceRecognition()
#     age_and_gender_recognizer = GenderAgeDetection()
#     featured_face_path = "../../../../face-images/FatihYavuz.jpg"
#     featured_face_img = cv2.imread(featured_face_path)
#     if img is not None and featured_face_img is not None:
#         recognized_faces = face_recognizer.recognize_faces(img, featured_face_img)

#         annotated_img = face_detector.draw_faces(img)
#         annotated_img = face_recognizer.draw_recognized_faces(img, recognized_faces)
#         annotated_img = age_and_gender_recognizer.draw_age_and_gender(annotated_img)
#         cv2.imshow("Face Recognition", annotated_img)
#         cv2.waitKey(0)
#         cv2.destroyAllWindows()
#     else:
#         print(f"Could not load image: {img_path} or {featured_face_path}")

# main.py

# -----------------------------------------------------------

# import cv2
# import numpy as np
# from face_detection import FaceDetection
# from gender_age_detection import GenderAgeDetection
# from face_recognition import FaceRecognition

# if __name__ == "__main__":
#     # Face Detection Example
#     face_detector = FaceDetection()
#     # Gender and Age Recognition Example
#     recognizer = GenderAgeDetection()
#     # Face Recognition Example
#     face_recognizer = FaceRecognition()

#     img_path = "../../../../face-images/kilise.jpeg"
#     img = cv2.imread(img_path)

#     featured_face_path = "../../../../face-images/FatihYavuz.jpg"
#     featured_face_img = cv2.imread(featured_face_path)
#     if img is not None and featured_face_img is not None:
#         recognized_faces = face_recognizer.recognize_faces(img, featured_face_img)
#         for bbox, embedding, similarity in recognized_faces:
#             print(f"Bounding Box: {bbox}, Similarity: {similarity:.2f}")
#         result_img = face_detector.draw_faces(img)
#         annotated_img = recognizer.draw_age_and_gender(img)
#         annotated_img = face_recognizer.draw_recognized_faces(img, recognized_faces)
#         cv2.imshow("Face Recognition", annotated_img)
#         cv2.waitKey(0)
#         cv2.destroyAllWindows()
#     else:
#         print(f"Could not load image: {img_path} or {featured_face_path}")

#     # Live Face Recognition
#     if featured_face_img is not None:
#         face_recognizer.recognize_faces_live(featured_face_img)
#     else:
#         print(f"Could not load featured face image: {featured_face_path}")

# -----------------------------------------------------------

import onnxruntime as ort
import numpy as np
import os

# Check if CUDA is available
providers = ort.get_available_providers()
print("Available providers:", providers)

# Create a session with the ONNX model
session = ort.InferenceSession(
    os.path.expanduser("~/.insightface/models/buffalo_l/w600k_r50.onnx"),
    providers=["CUDAExecutionProvider"],
)

# Print the used provider
print("Running on:", session.get_providers())
# Create dummy input data
input_name = session.get_inputs()[0].name
input_shape = session.get_inputs()[0].shape

# Check if input_shape contains only integers
if all(isinstance(i, int) for i in input_shape):
    dummy_input = np.random.rand(*input_shape).astype(np.float32)
else:
    print("Invalid input shape:", input_shape)
    dummy_input = None

# Run the model
if dummy_input is not None:
    output = session.run(None, {input_name: dummy_input})
    print("Model output shape:", output[0].shape)
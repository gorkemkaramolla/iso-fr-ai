# gender_age_recognition.py

import cv2
import numpy as np
from typing import List, Tuple, Optional
from base_face_detection import BaseFaceDetection


class GenderAgeDetection(BaseFaceDetection):
    def __init__(
        self,
        providers: List[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
        det_size: Tuple[int, int] = (640, 640),
    ):
        super().__init__(providers=providers, det_size=det_size)

    def detect_age_and_gender(
        self, img: np.ndarray
    ) -> List[Tuple[str, int, np.ndarray]]:
        """
        Analyzes the given image and returns the age, gender, and bounding boxes for detected faces.

        Args:
            img (np.ndarray): The image to analyze.

        Returns:
            List[Tuple[str, int, np.ndarray]]: A list of tuples containing gender, age, and bounding box for each detected face.
        """
        results: List[Tuple[str, int, np.ndarray]] = []

        # Detect faces
        faces = self.get_faces(img)

        for face in faces:
            gender: str = "Male" if face.gender == 1 else "Female"
            age: int = face.age
            bbox: np.ndarray = face.bbox.astype(np.int32)
            results.append((gender, age, bbox))

        return results

    def draw_age_and_gender(
        self,
        img: np.ndarray,
        results: Optional[List[Tuple[str, int, np.ndarray]]] = None,
    ) -> np.ndarray:
        """
        Draws bounding boxes and annotations for age and gender on the image.

        Args:
            img (np.ndarray): The image on which to draw annotations.
            results (List[Tuple[str, int, np.ndarray]]): The detection results containing gender, age, and bounding boxes.

        Returns:
            np.ndarray: The image with annotations drawn.
        """

        if results is None:
            results = self.detect_age_and_gender(img)
        for gender, age, bbox in results:

            cv2.putText(
                img,
                f"Gender: {gender}, Age: {age}",
                (bbox[0], bbox[1] - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 255),
                2,
            )
        return img


# import cv2
# import numpy as np
# from insightface.app import FaceAnalysis
# from typing import Optional, List, Tuple
# import os


# class GenderAgeDetection:
#     def __init__(
#         self,
#         providers: List[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
#         det_size: Tuple[int, int] = (640, 640),
#     ):
#         self.app = FaceAnalysis(providers=providers)
#         self.app.prepare(ctx_id=0, det_size=det_size)

#     def detect_age_and_gender(
#         self, img: np.ndarray
#     ) -> List[Tuple[str, int, np.ndarray]]:
#         """
#         Analyzes the given image and returns the age, gender, and bounding boxes for detected faces.

#         Args:
#             img (np.ndarray): The image to analyze.

#         Returns:
#             List[Tuple[str, int, np.ndarray]]: A list of tuples containing gender, age, and bounding box for each detected face.
#         """
#         results: List[Tuple[str, int, np.ndarray]] = []

#         # Detect faces
#         faces = self.app.get(img)

#         for face in faces:
#             gender: str = "Male" if face.gender == 1 else "Female"
#             age: int = face.age
#             bbox: np.ndarray = face.bbox.astype(np.int32)
#             results.append((gender, age, bbox))

#         return results


# # Usage example
# if __name__ == "__main__":
#     directory = "../../../face-images"
#     recognizer = GenderAgeDetection()
#     # recognizer.process_directory(directory)

#     # Example for analyze_image method
#     img_path = "../../../face-images/FatihYavuz.jpg"
#     img = cv2.imread(img_path)
#     if img is not None:
#         results = recognizer.detect_age_and_gender(img)
#         for gender, age, bbox in results:
#             print(f"Detected Gender: {gender}, Age: {age}, Bounding Box: {bbox}")
#     else:
#         print(f"Could not load image: {img_path}")

# def detect_age_and_gender(self, image_path: str) -> Optional[np.ndarray]:
#     """
#     Detects age and gender for faces in the given image.

#     Args:
#         image_path (str): The path to the image file.

#     Returns:
#         Optional[np.ndarray]: The image with detected faces, age, and gender annotated.
#     """
#     # Load the image
#     img: Optional[np.ndarray] = cv2.imread(image_path)
#     if img is None:
#         print(f"Could not load image: {image_path}")
#         return None

#     # Detect faces
#     faces = self.app.get(img)

#     for face in faces:
#         gender: str = "Male" if face.gender == 1 else "Female"
#         age: int = face.age
#         print(f"Gender: {gender}")
#         print(f"Age: {age}")

#         # Draw bounding box and annotate gender and age
#         bbox: np.ndarray = face.bbox.astype(np.int32)
#         cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
#         cv2.putText(
#             img,
#             f"Gender: {gender}, Age: {age}",
#             (bbox[0], bbox[1] - 10),
#             cv2.FONT_HERSHEY_SIMPLEX,
#             0.5,
#             (0, 255, 0),
#             2,
#         )

#     return img

# face_detection.py

import cv2
import numpy as np
from insightface.app import FaceAnalysis
from typing import List, Tuple, Optional
from base_face_detection import BaseFaceDetection


class FaceDetection(BaseFaceDetection):
    def __init__(
        self,
        providers: List[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
        det_size: Tuple[int, int] = (640, 640),
    ):
        super().__init__(providers=providers, det_size=det_size)

    def detect_faces(self, img: np.ndarray) -> List[np.ndarray]:
        """
        Detects faces in the given image.

        Args:
            img (np.ndarray): The image in which to detect faces.

        Returns:
            List[np.ndarray]: A list of bounding boxes for detected faces.
        """
        faces = self.get_faces(img)
        bboxes = [face.bbox.astype(np.int32) for face in faces]
        return bboxes

    def draw_faces(
        self, img: np.ndarray, bboxes: Optional[List[np.ndarray]] = None
    ) -> np.ndarray:
        """
        Draws bounding boxes around detected faces on the image.

        Args:
            img (np.ndarray): The image on which to draw bounding boxes.
            bboxes (List[np.ndarray]): A list of bounding boxes.

        Returns:
            np.ndarray: The image with bounding boxes drawn.
        """
        if bboxes is None:
            bboxes = self.detect_faces(img)
        for bbox in bboxes:
            cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 0, 255), 2)
        return img


# import cv2
# import numpy as np
# from insightface.app import FaceAnalysis
# from typing import List, Tuple, Optional
# import os


# class FaceDetection:
#     def __init__(
#         self,
#         providers: List[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
#         det_size: Tuple[int, int] = (640, 640),
#     ):
#         self.app = FaceAnalysis(providers=providers)
#         self.app.prepare(ctx_id=0, det_size=det_size)

#     def detect_faces(self, img: np.ndarray) -> List[np.ndarray]:
#         """
#         Detects faces in the given image.

#         Args:
#             img (np.ndarray): The image in which to detect faces.

#         Returns:
#             List[np.ndarray]: A list of bounding boxes for detected faces.
#         """
#         faces = self.app.get(img)
#         bboxes = [face.bbox.astype(np.int32) for face in faces]
#         return bboxes

#     def draw_faces(self, img: np.ndarray, bboxes: List[np.ndarray]) -> np.ndarray:
#         """
#         Draws bounding boxes around detected faces on the image.

#         Args:
#             img (np.ndarray): The image on which to draw bounding boxes.
#             bboxes (List[np.ndarray]): A list of bounding boxes.

#         Returns:
#             np.ndarray: The image with bounding boxes drawn.
#         """
#         for bbox in bboxes:
#             cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
#         return img


# # Usage example
# if __name__ == "__main__":
#     directory = "../../../face-images"
#     face_detector = FaceDetection()

#     # Check if the directory exists
#     if not os.path.isdir(directory):
#         print("Directory does not exist")
#     else:
#         print("Directory exists")

#         # Loop through all files in the directory
#         for filename in os.listdir(directory):
#             file_path: str = os.path.join(directory, filename)

#             # Check if the file is an image (basic check based on file extension)
#             if filename.lower().endswith((".png", ".jpg", ".jpeg")):
#                 print(f"Processing {filename}")

#                 # Load the image
#                 img: Optional[np.ndarray] = cv2.imread(file_path)
#                 if img is None:
#                     print(f"Could not load image: {file_path}")
#                     continue

#                 # Detect faces
#                 bboxes: List[np.ndarray] = face_detector.detect_faces(img)

#                 # Draw bounding boxes
#                 result_img: np.ndarray = face_detector.draw_faces(img, bboxes)

#                 # Display the result
#                 cv2.imshow("Face Detection", result_img)
#                 cv2.waitKey(0)
#                 cv2.destroyAllWindows()

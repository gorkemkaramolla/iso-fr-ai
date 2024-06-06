import cv2
import numpy as np
from insightface.app import FaceAnalysis
from typing import Optional, List, Tuple
import os


class GenderAgeRecognition:
    def __init__(
        self,
        providers: List[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
        det_size: Tuple[int, int] = (640, 640),
    ):
        self.app = FaceAnalysis(providers=providers)
        self.app.prepare(ctx_id=0, det_size=det_size)

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
        faces = self.app.get(img)

        for face in faces:
            gender: str = "Male" if face.gender == 1 else "Female"
            age: int = face.age
            bbox: np.ndarray = face.bbox.astype(np.int32)
            results.append((gender, age, bbox))

        return results


# Usage example
if __name__ == "__main__":
    directory = "../../../face-images"
    recognizer = GenderAgeRecognition()
    # recognizer.process_directory(directory)

    # Example for analyze_image method
    img_path = "../../../face-images/FatihYavuz.jpg"
    img = cv2.imread(img_path)
    if img is not None:
        results = recognizer.detect_age_and_gender(img)
        for gender, age, bbox in results:
            print(f"Detected Gender: {gender}, Age: {age}, Bounding Box: {bbox}")
    else:
        print(f"Could not load image: {img_path}")

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

    # def process_directory(self, directory: str) -> None:
    #     """
    #     Processes all images in the given directory for age and gender detection.

    #     Args:
    #         directory (str): The path to the directory containing image files.
    #     """
    #     # Check if the directory exists
    #     if not os.path.isdir(directory):
    #         print("Directory does not exist")
    #         return

    #     print("Directory exists")

    #     # Loop through all files in the directory
    #     for filename in os.listdir(directory):
    #         file_path: str = os.path.join(directory, filename)

    #         # Check if the file is an image (basic check based on file extension)
    #         if filename.lower().endswith((".png", ".jpg", ".jpeg")):
    #             print(f"Processing {filename}")

    #             # Detect age and gender
    #             result_img: Optional[np.ndarray] = self.detect_age_and_gender(file_path)

    #             if result_img is not None:
    #                 # Display the result
    #                 cv2.imshow("Gender and Age Detection", result_img)
    #                 cv2.waitKey(0)
    #                 cv2.destroyAllWindows()


# import cv2
# import numpy as np
# from insightface.app import FaceAnalysis
# from typing import Optional
# import os


# class GenderAgeRecognition:
#     def __init__(
#         self,
#         providers: list[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
#         det_size: tuple[int, int] = (640, 640),
#     ):
#         self.app = FaceAnalysis(providers=providers)
#         self.app.prepare(ctx_id=0, det_size=det_size)

#     def detect_age_and_gender(self, image_path: str) -> Optional[np.ndarray]:
#         """
#         Detects age and gender for faces in the given image.

#         Args:
#             image_path (str): The path to the image file.

#         Returns:
#             Optional[np.ndarray]: The image with detected faces, age, and gender annotated.
#         """
#         # Load the image
#         img: Optional[np.ndarray] = cv2.imread(image_path)
#         if img is None:
#             print(f"Could not load image: {image_path}")
#             return None

#         # Detect faces
#         faces = self.app.get(img)

#         for face in faces:
#             gender: str = "Male" if face.gender == 1 else "Female"
#             age: int = face.age
#             print(f"Gender: {gender}")
#             print(f"Age: {age}")

#             # Draw bounding box and annotate gender and age
#             bbox: np.ndarray = face.bbox.astype(np.int32)
#             cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
#             cv2.putText(
#                 img,
#                 f"Gender: {gender}, Age: {age}",
#                 (bbox[0], bbox[1] - 10),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.5,
#                 (0, 255, 0),
#                 2,
#             )

#         return img

#     def process_directory(self, directory: str) -> None:
#         """
#         Processes all images in the given directory for age and gender detection.

#         Args:
#             directory (str): The path to the directory containing image files.
#         """
#         # Check if the directory exists
#         if not os.path.isdir(directory):
#             print("Directory does not exist")
#             return

#         print("Directory exists")

#         # Loop through all files in the directory
#         for filename in os.listdir(directory):
#             file_path: str = os.path.join(directory, filename)

#             # Check if the file is an image (basic check based on file extension)
#             if filename.lower().endswith((".png", ".jpg", ".jpeg")):
#                 print(f"Processing {filename}")

#                 # Detect age and gender
#                 result_img: Optional[np.ndarray] = self.detect_age_and_gender(file_path)

#                 if result_img is not None:
#                     # Display the result
#                     cv2.imshow("Gender and Age Detection", result_img)
#                     cv2.waitKey(0)
#                     cv2.destroyAllWindows()


# # Usage example
# if __name__ == "__main__":
#     directory = "../../../face-images"
#     recognizer = GenderAgeRecognition()
#     recognizer.process_directory(directory)


# import cv2
# import numpy as np
# from insightface.app import FaceAnalysis
# from typing import Optional
# import os

# # Initialize the FaceAnalysis object with CUDA and CPU providers
# app = FaceAnalysis(providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
# app.prepare(ctx_id=0, det_size=(640, 640))


# def detect_age_and_gender(image_path: str) -> Optional[np.ndarray]:
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
#     faces = app.get(img)

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


# # Define the directory containing the images
# directory: str = "../../../face-images"

# # Check if the directory exists
# if os.path.isdir(directory):
#     print("Directory exists")

#     # Loop through all files in the directory
#     for filename in os.listdir(directory):
#         file_path: str = os.path.join(directory, filename)

#         # Check if the file is an image (basic check based on file extension)
#         if filename.lower().endswith((".png", ".jpg", ".jpeg")):
#             print(f"Processing {filename}")

#             # Detect age and gender
#             result_img: Optional[np.ndarray] = detect_age_and_gender(file_path)

#             if result_img is not None:
#                 # Display the result

#                 # Get screen size
#                 # screen_res = 1280, 720  # Replace with your screen resolution

#                 # # Get the aspect ratio of the image
#                 # aspect = result_img.shape[1] / float(result_img.shape[0])

#                 # if aspect > 1:
#                 #     # If image is wide
#                 #     res = int(screen_res[0] / aspect), screen_res[0]
#                 # else:
#                 #     # If image is tall or square
#                 #     res = screen_res[1], int(screen_res[1] * aspect)

#                 # # Resize the image to fit the screen
#                 # img = cv2.resize(result_img, res, interpolation=cv2.INTER_CUBIC)

#                 # Display the image
#                 cv2.imshow("image", result_img)
#                 cv2.waitKey(0)
#                 cv2.destroyAllWindows()
# else:
#     print("Directory does not exist")

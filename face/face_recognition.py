# face_recognition.py

import cv2
import numpy as np
from typing import List, Optional, Tuple
from base_face_detection import BaseFaceDetection


class FaceRecognition(BaseFaceDetection):
    def __init__(
        self,
        providers: List[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
        det_size: Tuple[int, int] = (640, 640),
    ):
        super().__init__(providers=providers, det_size=det_size)

    def recognize_faces(
        self, img: np.ndarray, featured_face_img: np.ndarray
    ) -> List[Tuple[np.ndarray, np.ndarray, float]]:
        """
        Recognizes faces in the given image by comparing with the featured face image.

        Args:
            img (np.ndarray): The image in which to recognize faces.
            featured_face_img (np.ndarray): The image containing the featured face.

        Returns:
            List[Tuple[np.ndarray, np.ndarray, float]]: A list of tuples containing the bounding boxes, embeddings, and similarity score for each detected face.
        """
        results: List[Tuple[np.ndarray, np.ndarray, float]] = []

        # Get the embedding for the featured face
        featured_faces = self.get_faces(featured_face_img)
        if len(featured_faces) != 1:
            raise ValueError("Featured face image must contain exactly one face.")
        featured_embedding = featured_faces[0].embedding

        # Detect faces in the input image
        faces = self.get_faces(img)
        for face in faces:
            bbox = face.bbox.astype(np.int32)
            embedding = face.embedding
            similarity = self._compute_similarity(featured_embedding, embedding)
            results.append((bbox, embedding, similarity))

        return results

    def _compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Computes the similarity between two embeddings using cosine similarity.

        Args:
            emb1 (np.ndarray): The first embedding.
            emb2 (np.ndarray): The second embedding.

        Returns:
            float: The similarity score between the two embeddings.
        """
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

    def draw_recognized_faces(
        self,
        img: np.ndarray,
        recognized_faces: Optional[List[Tuple[np.ndarray, np.ndarray, float]]] = None,
    ) -> np.ndarray:
        """
        Draws bounding boxes and annotations for recognized faces on the image.

        Args:
            img (np.ndarray): The image on which to draw annotations.
            recognized_faces (List[Tuple[np.ndarray, np.ndarray, float]]): The detection results containing bounding boxes, embeddings, and similarity scores.

        Returns:
            np.ndarray: The image with annotations drawn.
        """
        if recognized_faces is None:
            recognized_faces = self.recognize_faces(img)
        for bbox, embedding, similarity in recognized_faces:
            cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
            cv2.putText(
                img,
                f"Sim: {similarity:.2f}",
                (bbox[0], bbox[1] - 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2,
            )
        return img

    def recognize_faces_live(self, featured_face_img: np.ndarray) -> None:
        """
        Recognizes faces from the live camera stream by comparing with the featured face image.

        Args:
            featured_face_img (np.ndarray): The image containing the featured face.
        """
        cap = cv2.VideoCapture(
            "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile="
        )

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            recognized_faces = self.recognize_faces(frame, featured_face_img)
            annotated_frame = self.draw_recognized_faces(frame, recognized_faces)

            cv2.imshow("Live Face Recognition", annotated_frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        cap.release()
        cv2.destroyAllWindows()

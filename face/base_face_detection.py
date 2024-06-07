# base_face_detection.py

import cv2
import numpy as np
from insightface.app import FaceAnalysis
from typing import List, Tuple, Optional


class BaseFaceDetection:
    def __init__(
        self,
        providers: List[str] = ["CUDAExecutionProvider", "CPUExecutionProvider"],
        det_size: Tuple[int, int] = (640, 640),
    ):
        self._app = FaceAnalysis(providers=providers)
        self._app.prepare(ctx_id=0, det_size=det_size)

    def get_faces(self, img: np.ndarray) -> List:
        """
        Gets faces in the given image.

        Args:
            img (np.ndarray): The image in which to get faces.

        Returns:
            List: A list of detected faces.
        """
        faces = self._app.get(img)
        return faces

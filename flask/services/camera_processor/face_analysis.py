from __future__ import division
import cv2
import os.path as osp
import onnxruntime
from common import Face
from scrfd import SCRFD
import numpy as np

__all__ = ["FaceAnalysis"]


class FaceAnalysis:
    def __init__(
        self,
        root="~/.insightface",
        models="/models",
        name="/buffalo_l",
        detection_model="genderage.onnx",
        det_thresh=0.5,
        det_size=(640, 640),
        session=None,
    ):
        onnxruntime.set_default_logger_severity(3)

        # InsightFace's desired model path
        # self.model = "~/.insightface/models/buffalo_l/genderage.onnx"

        # # Detection model path
        # self.det_model_path = osp.join(self.model_dir, detection_model)
        # Check if the model file exists
        home_dir = osp.expanduser("~")
        self.model = f"{home_dir}/.insightface/models/buffalo_l/genderage.onnx"

        # Check if the model file exists
        assert osp.isfile(self.model), "Model file not found!" + self.model

        self.session = session
        self.taskname = "genderage"
        if self.session is None:
            # assert self.model is not None
            # assert osp.exists(self.model), "Model file not found!" + self.model
            self.session = onnxruntime.InferenceSession(
                self.model,
                providers=["CUDAExecutionProvider"],
            )
        self.det_thresh = det_thresh
        self.det_size = det_size

        # Set the directory path for the models
        self.assets_dir = osp.expanduser("~/.insightface/models/buffalo_l")

        # Initialize the SCRFD detector with the model file
        detector_path = osp.join(self.assets_dir, "det_10g.onnx")
        self.det_model = SCRFD(detector_path)
        self.det_model.prepare(0)

    # def prepare(self, ctx_id, ):
    #     self.det_thresh = det_thresh
    #     assert det_size is not None
    #     print("set det-size:", det_size)
    #     self.det_size = det_size
    #     for taskname, model in self.models.items():
    #         if taskname == "detection":
    #             model.prepare(
    #                 ctx_id,
    #                 input_size=det_size,
    #                 det_thresh=det_thresh,
    #             )
    #         else:
    #             model.prepare(ctx_id)

    def get(self, img, max_num=0):
        bboxes, kpss = self.det_model.detect(
            img,
            max_num=max_num,
            input_size=self.det_size,
            metric="default",
        )
        if bboxes.shape[0] == 0:
            return []
        ret = []
        for i in range(bboxes.shape[0]):
            bbox = bboxes[i, 0:4]
            det_score = bboxes[i, 4]
            kps = None
            if kpss is not None:
                kps = kpss[i]
            face = Face(bbox=bbox, kps=kps, det_score=det_score)
            # for taskname, model in self.models.items():
            #     if taskname == "detection":
            #         continue
            # model.get(img, face)
            ret.append(face)
        return ret

    def draw_on(self, img, faces):

        dimg = img.copy()
        for i in range(len(faces)):
            face = faces[i]
            box = face.bbox.astype(int)
            color = (0, 0, 255)
            cv2.rectangle(dimg, (box[0], box[1]), (box[2], box[3]), color, 2)
            if face.kps is not None:
                kps = face.kps.astype(int)
                # print(landmark.shape)
                for l in range(kps.shape[0]):
                    color = (0, 0, 255)
                    if l == 0 or l == 3:
                        color = (0, 255, 0)
                    cv2.circle(dimg, (kps[l][0], kps[l][1]), 1, color, 2)
            if face.gender is not None and face.age is not None:
                cv2.putText(
                    dimg,
                    "%s,%d" % (face.sex, face.age),
                    (box[0] - 1, box[1] - 4),
                    cv2.FONT_HERSHEY_COMPLEX,
                    0.7,
                    (0, 255, 0),
                    1,
                )
        return dimg


# ----------------------------

if __name__ == "__main__":
    fa = FaceAnalysis()

    img = cv2.imread("../../../face-images/FatihYavuz.jpg")
    faces = fa.get(img)
    print(faces)
    img = fa.draw_on(img, faces)
    cv2.imshow("facedet", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

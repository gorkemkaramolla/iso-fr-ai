## ------------- SCRFD Detection Model -------------

import os
import cv2
import math
import torch
import numpy as np
import torch.nn.functional as F
from MiniFASNet import MiniFASNetV1, MiniFASNetV2, MiniFASNetV1SE, MiniFASNetV2SE
import transform as trans
from utility import get_kernel, parse_model_name
from scrfd import SCRFD  # Make sure to import your SCRFD class

MODEL_MAPPING = {
    'MiniFASNetV1': MiniFASNetV1,
    'MiniFASNetV2': MiniFASNetV2,
    'MiniFASNetV1SE': MiniFASNetV1SE,
    'MiniFASNetV2SE': MiniFASNetV2SE
}


class AntiSpoofPredict:
    def __init__(self, device_id, scrfd_model_path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Initialize SCRFD with the given model path
        self.detector = SCRFD(model_file=scrfd_model_path)
        self.detector.prepare(ctx_id=0)  # Use CUDA (ctx_id=0), set to -1 for CPU

    def _load_model(self, model_path):
        # Define and load the MiniFASNet model
        model_name = os.path.basename(model_path)
        h_input, w_input, model_type, _ = parse_model_name(model_name)
        self.kernel_size = get_kernel(h_input, w_input)
        self.model = MODEL_MAPPING[model_type](conv6_kernel=self.kernel_size).to(self.device)

        # Load model weights
        state_dict = torch.load(model_path, map_location=self.device)
        if 'module.' in list(state_dict.keys())[0]:
            state_dict = {k[7:]: v for k, v in state_dict.items()}
        self.model.load_state_dict(state_dict)

    def get_bbox(self, img):
        # Use SCRFD to detect faces and return the bounding box
        bboxes, _ = self.detector.detect(img, input_size=(640, 640), thresh=0.5)
        if len(bboxes) == 0:
            return None
        # Convert SCRFD bounding box format to (x, y, width, height)
        bbox = bboxes[0]
        return [int(bbox[0]), int(bbox[1]), int(bbox[2] - bbox[0]), int(bbox[3] - bbox[1])]

    def predict(self, img, model_path):
        # Preprocess and predict using the MiniFASNet model
        test_transform = trans.Compose([
            trans.ToTensor(),
        ])
        img = test_transform(img).unsqueeze(0).to(self.device)
        self._load_model(model_path)
        self.model.eval()
        with torch.no_grad():
            result = self.model.forward(img)
            result = F.softmax(result).cpu().numpy()
        return result



# -*- coding: utf-8 -*-
# @Time : 20-6-9 上午10:20
# @Author : zhuying
# @Company : Minivision
# @File : anti_spoof_predict.py
# @Software : PyCharm
#### ------------- WiderFace RetinaFace Detection Model -------------
# import os
# import cv2
# import math
# import torch
# import numpy as np
# import torch.nn.functional as F


# from MiniFASNet import MiniFASNetV1, MiniFASNetV2,MiniFASNetV1SE,MiniFASNetV2SE
# import transform as trans
# from utility import get_kernel, parse_model_name

# MODEL_MAPPING = {
#     'MiniFASNetV1': MiniFASNetV1,
#     'MiniFASNetV2': MiniFASNetV2,
#     'MiniFASNetV1SE':MiniFASNetV1SE,
#     'MiniFASNetV2SE':MiniFASNetV2SE
# }


# class Detection:
#     def __init__(self):
#         caffemodel = os.path.abspath("../models/detection_model/Widerface-RetinaFace.caffemodel")
#         deploy = os.path.abspath("../models/detection_model/deploy.prototxt")
        
#         if not os.path.exists(caffemodel):
#             raise FileNotFoundError(f"Caffe model file not found: {caffemodel}")
#         if not os.path.exists(deploy):
#             raise FileNotFoundError(f"Deploy file not found: {deploy}")
        
#         self.detector = cv2.dnn.readNetFromCaffe(deploy, caffemodel)
#         self.detector_confidence = 0.6

#     def get_bbox(self, img):
#         height, width = img.shape[0], img.shape[1]
#         aspect_ratio = width / height
#         if img.shape[1] * img.shape[0] >= 192 * 192:
#             img = cv2.resize(img,
#                              (int(192 * math.sqrt(aspect_ratio)),
#                               int(192 / math.sqrt(aspect_ratio))), interpolation=cv2.INTER_LINEAR)

#         blob = cv2.dnn.blobFromImage(img, 1, mean=(104, 117, 123))
#         self.detector.setInput(blob, 'data')
#         out = self.detector.forward('detection_out').squeeze()
#         max_conf_index = np.argmax(out[:, 2])
#         left, top, right, bottom = out[max_conf_index, 3]*width, out[max_conf_index, 4]*height, \
#                                    out[max_conf_index, 5]*width, out[max_conf_index, 6]*height
#         bbox = [int(left), int(top), int(right-left+1), int(bottom-top+1)]
#         return bbox


# class AntiSpoofPredict(Detection):
#     def __init__(self, device_id):
#         super(AntiSpoofPredict, self).__init__()
#         self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

#     def _load_model(self, model_path):
#         # define model
#         model_name = os.path.basename(model_path)
#         h_input, w_input, model_type, _ = parse_model_name(model_name)
#         self.kernel_size = get_kernel(h_input, w_input,)
#         self.model = MODEL_MAPPING[model_type](conv6_kernel=self.kernel_size).to(self.device)

#         # load model weight
#         state_dict = torch.load(model_path, map_location=self.device)
#         keys = iter(state_dict)
#         first_layer_name = keys.__next__()
#         if first_layer_name.find('module.') >= 0:
#             from collections import OrderedDict
#             new_state_dict = OrderedDict()
#             for key, value in state_dict.items():
#                 name_key = key[7:]
#                 new_state_dict[name_key] = value
#             self.model.load_state_dict(new_state_dict)
#         else:
#             self.model.load_state_dict(state_dict)
#         return None

#     def predict(self, img, model_path):
#         test_transform = trans.Compose([
#             trans.ToTensor(),
#         ])
#         img = test_transform(img)
#         img = img.unsqueeze(0).to(self.device)
#         self._load_model(model_path)
#         self.model.eval()
#         with torch.no_grad():
#             result = self.model.forward(img)
#             result = F.softmax(result).cpu().numpy()
#         return result











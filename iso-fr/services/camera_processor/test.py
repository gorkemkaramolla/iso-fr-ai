# --------------------------- Real-time Anti-Spoofing Detection - SCRFD ---------------------------
import os
import cv2
import numpy as np
import argparse
import warnings
import time

from anti_spoof_predict import AntiSpoofPredict
from generate_patches import CropImage
from utility import parse_model_name
warnings.filterwarnings('ignore')

def process_frame(frame, model_test: AntiSpoofPredict, image_cropper, anti_spoofing_model_path):
    bbox = model_test.get_bbox(frame)
    if bbox is None:
        return frame, None, None, 0

    prediction = np.zeros((1, 3))
    test_speed = 0

    # for model_name in os.listdir(model_dir):
    h_input, w_input, model_type, scale = parse_model_name(os.path.basename(anti_spoofing_model_path))
    param = {
        "org_img": frame,
        "bbox": bbox,
        "scale": scale,
        "out_w": w_input,
        "out_h": h_input,
        "crop": True,
    }
    if scale is None:
        param["crop"] = False
    img = image_cropper.crop(**param)
    start = time.time()
    prediction += model_test.predict(img)
    test_speed += time.time() - start

    label = np.argmax(prediction)
    value = prediction[0][label] 
    color = (255, 0, 0) if label == 1 else (0, 0, 255)
    result_text = "RealFace Score: {:.2f}".format(value) if label == 1 else "FakeFace Score: {:.2f}".format(value)

    cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[0] + bbox[2], bbox[1] + bbox[3]), color, 2)
    cv2.putText(frame, result_text, (bbox[0], bbox[1] - 5), cv2.FONT_HERSHEY_COMPLEX, 0.5 * frame.shape[0] / 1024, color)

    return frame, label, value, test_speed


def run_real_time(camera_url, anti_spoofing_model_path, scrfd_model_path):
    cap = cv2.VideoCapture(camera_url)
    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return

    model_test = AntiSpoofPredict(anti_spoofing_model_path, scrfd_model_path)
    image_cropper = CropImage()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture frame.")
            break

        processed_frame, label, value, test_speed = process_frame(frame, model_test, image_cropper, anti_spoofing_model_path)

        # Display the processed frame
        cv2.imshow('Anti-Spoofing Detection', processed_frame)

        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    desc = "Real-time Anti-Spoofing Detection"
    parser = argparse.ArgumentParser(description=desc)
    # parser.add_argument("--device_id", type=int, default=0, help="which GPU id, [0/1/2/3]")
    parser.add_argument("--anti_spoofing_model_path", type=str, default="../models/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth", help="model library used for testing")
    parser.add_argument("--camera_url", type=str,  default="http://root:N143g144@192.168.100.152/mjpg/video.mjpg?resolution=1920x1080&compression=20&mirror=1&fps=15&audio=0&maxframesize=0&videocodec=jpeg&rotation=180&text=1&textstring=Compression:%23c Frame size:%23F kbytes FPS:%23r&timestamp=1723643483761](http://root:N143g144@192.168.100.152/mjpg/video.mjpg?resolution=1920x1080&compression=20&mirror=1&fps=15&audio=0&maxframesize=0&videocodec=jpeg&rotation=180&text=1&textstring=Compression:%23c%20Frame%20size:%23F%20kbytes%20FPS:%23r&timestamp=1723643483761", help="IP camera URL")
    parser.add_argument("--scrfd_model_path", type=str, default="../models/buffalo_l/det_10g.onnx", help="Path to the SCRFD model")
    args = parser.parse_args()

    run_real_time(args.camera_url, args.anti_spoofing_model_path, args.scrfd_model_path)




# --------------------- Anti-spoofing test with Camera - WiderFace ---------------------
# import os
# import cv2
# import numpy as np
# import argparse
# import warnings
# import time

# from anti_spoof_predict import AntiSpoofPredict
# from generate_patches import CropImage
# from utility import parse_model_name

# warnings.filterwarnings('ignore')

# def process_frame(frame, model_test, image_cropper, model_dir):
#     image_bbox = model_test.get_bbox(frame)
#     prediction = np.zeros((1, 3))
#     test_speed = 0

#     for model_name in os.listdir(model_dir):
#         h_input, w_input, model_type, scale = parse_model_name(model_name)
#         param = {
#             "org_img": frame,
#             "bbox": image_bbox,
#             "scale": scale,
#             "out_w": w_input,
#             "out_h": h_input,
#             "crop": True,
#         }
#         if scale is None:
#             param["crop"] = False
#         img = image_cropper.crop(**param)
#         start = time.time()
#         prediction += model_test.predict(img, os.path.join(model_dir, model_name))
#         test_speed += time.time() - start

#     label = np.argmax(prediction)
#     value = prediction[0][label] / 2
#     if label == 1:
#         result_text = "RealFace Score: {:.2f}".format(value)
#         color = (255, 0, 0)
#     else:
#         result_text = "FakeFace Score: {:.2f}".format(value)
#         color = (0, 0, 255)

#     cv2.rectangle(
#         frame,
#         (image_bbox[0], image_bbox[1]),
#         (image_bbox[0] + image_bbox[2], image_bbox[1] + image_bbox[3]),
#         color, 2)
#     cv2.putText(
#         frame,
#         result_text,
#         (image_bbox[0], image_bbox[1] - 5),
#         cv2.FONT_HERSHEY_COMPLEX, 0.5 * frame.shape[0] / 1024, color)

#     return frame, label, value, test_speed


# def run_real_time(camera_url, model_dir, device_id):
#     cap = cv2.VideoCapture(camera_url)
#     if not cap.isOpened():
#         print("Error: Could not open video stream.")
#         return

#     model_test = AntiSpoofPredict(device_id)
#     image_cropper = CropImage()

#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             print("Error: Failed to capture frame.")
#             break

#         processed_frame, label, value, test_speed = process_frame(frame, model_test, image_cropper, model_dir)

#         # Display the processed frame
#         cv2.imshow('Anti-Spoofing Detection', processed_frame)

#         # Break the loop if 'q' is pressed
#         if cv2.waitKey(1) & 0xFF == ord('q'):
#             break

#     cap.release()
#     cv2.destroyAllWindows()

# if __name__ == "__main__":
#     desc = "Real-time Anti-Spoofing Detection"
#     parser = argparse.ArgumentParser(description=desc)
#     parser.add_argument(
#         "--device_id",
#         type=int,
#         default=0,
#         help="which GPU id, [0/1/2/3]")
#     parser.add_argument(
#         "--model_dir",
#         type=str,
#         default="../models/anti_spoof_models",
#         help="model library used for testing")
#     parser.add_argument(
#         "--camera_url",
#         type=str,
#         default="http://root:N143g144@192.168.100.152/mjpg/video.mjpg?resolution=1920x1080&compression=20&mirror=1&fps=15&audio=0&maxframesize=0&videocodec=jpeg&rotation=180&text=1&textstring=Compression:%23c Frame size:%23F kbytes FPS:%23r&timestamp=1723643483761](http://root:N143g144@192.168.100.152/mjpg/video.mjpg?resolution=1920x1080&compression=20&mirror=1&fps=15&audio=0&maxframesize=0&videocodec=jpeg&rotation=180&text=1&textstring=Compression:%23c%20Frame%20size:%23F%20kbytes%20FPS:%23r&timestamp=1723643483761",
#         help="IP camera URL")
#     args = parser.parse_args()

#     run_real_time(args.camera_url, args.model_dir, args.device_id)




# --------------------------- Open Camera ---------------------------
#  import cv2

# camera_url = 'http://127.0.0.1:5000/video_feed'
# cap = cv2.VideoCapture(camera_url)
# if not cap.isOpened():
#     print("Error: Could not open stream.")
# else:
#     ret, frame = cap.read()
#     if ret:
#         cv2.imshow('Frame', frame)
#         cv2.waitKey(0)
#         cv2.destroyAllWindows()
#     cap.release()
# -*- coding: utf-8 -*-
# @Time : 20-6-9 下午3:06
# @Author : zhuying
# @Company : Minivision
# @File : test.py
# @Software : PyCharm

# ------------------- Anti-spoofing test with Image -------------------

# import os
# import cv2
# import numpy as np
# import argparse
# import warnings
# import time

# from anti_spoof_predict import AntiSpoofPredict
# from generate_patches import CropImage
# from utility import parse_model_name
# warnings.filterwarnings('ignore')


# SAMPLE_IMAGE_PATH = "../../face-images/"


# def test(image_name, model_dir, device_id):
#     model_test = AntiSpoofPredict(device_id)
#     image_cropper = CropImage()
#     image = cv2.imread(SAMPLE_IMAGE_PATH + image_name)
   
#     image_bbox = model_test.get_bbox(image)
#     prediction = np.zeros((1, 3))
#     test_speed = 0
#     # sum the prediction from single model's result
#     for model_name in os.listdir(model_dir):
#         h_input, w_input, model_type, scale = parse_model_name(model_name)
#         param = {
#             "org_img": image,
#             "bbox": image_bbox,
#             "scale": scale,
#             "out_w": w_input,
#             "out_h": h_input,
#             "crop": True,
#         }
#         if scale is None:
#             param["crop"] = False
#         img = image_cropper.crop(**param)
#         start = time.time()
#         prediction += model_test.predict(img, os.path.join(model_dir, model_name))
#         test_speed += time.time()-start

#     # draw result of prediction
#     label = np.argmax(prediction)
#     value = prediction[0][label]/2
#     if label == 1:
#         print("Image '{}' is Real Face. Score: {:.2f}.".format(image_name, value))
#         result_text = "RealFace Score: {:.2f}".format(value)
#         color = (255, 0, 0)
#     else:
#         print("Image '{}' is Fake Face. Score: {:.2f}.".format(image_name, value))
#         result_text = "FakeFace Score: {:.2f}".format(value)
#         color = (0, 0, 255)
#     print("Prediction cost {:.2f} s".format(test_speed))
#     cv2.rectangle(
#         image,
#         (image_bbox[0], image_bbox[1]),
#         (image_bbox[0] + image_bbox[2], image_bbox[1] + image_bbox[3]),
#         color, 2)
#     cv2.putText(
#         image,
#         result_text,
#         (image_bbox[0], image_bbox[1] - 5),
#         cv2.FONT_HERSHEY_COMPLEX, 0.5*image.shape[0]/1024, color)

#     format_ = os.path.splitext(image_name)[-1]
#     result_image_name = image_name.replace(format_, "_result" + format_)
#     cv2.imwrite(SAMPLE_IMAGE_PATH + result_image_name, image)


# if __name__ == "__main__":
#     desc = "test"
#     parser = argparse.ArgumentParser(description=desc)
#     parser.add_argument(
#         "--device_id",
#         type=int,
#         default=0,
#         help="which gpu id, [0/1/2/3]")
#     parser.add_argument(
#         "--model_dir",
#         type=str,
#         default="../models/anti_spoof_models",
#         help="model_lib used to test")
#     parser.add_argument(
#         "--image_name",
#         type=str,
#         default="image_F1.jpg",
#         help="image used to test")
#     args = parser.parse_args()
#     test(args.image_name, args.model_dir, args.device_id)
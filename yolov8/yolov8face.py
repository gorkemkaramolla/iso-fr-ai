import time
import cv2
import argparse
from ultralytics import YOLO
import supervision as sv
from PIL import Image
import numpy as np
import os
from datetime import datetime
def parse_arguments()-> argparse.Namespace:
    parser = argparse.ArgumentParser(description="YOLOv8")
    parser.add_argument("--webcam-resolution",nargs=2,default=[1280,720],type=int)
    args = parser.parse_args()
    return args
def main():
    args = parse_arguments()
    frame_width, frame_height = args.webcam_resolution
    cap = cv2.VideoCapture(1)
    model = YOLO("yolov8n-face.pt", verbose=False)
    box_annotator = sv.BoxAnnotator(
        thickness=2,
        text_thickness=2,
        text_scale=1,
    )
    while True:
        ret, frame = cap.read()
        
        # Detect faces using YOLO
        result = model(frame)[0]
        detections = sv.Detections.from_yolov8(result)
        labels = [
                f"{model.model.names[class_id]} {confidence:.2f}"
                for _, confidence, class_id, _ in detections
            ]
        frame = box_annotator.annotate(scene=frame, detections=detections, labels=labels)
        
        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()


import cv2
import argparse
from ultralytics import YOLO
import supervision as sv
from PIL import Image
import numpy as np
import os
import face_recognition

def parse_arguments()-> argparse.Namespace:
    parser = argparse.ArgumentParser(description="YOLOv8")
    parser.add_argument("--webcam-resolution",nargs=2,default=[1280,720],type=int)
    args = parser.parse_args()
    return args
def main():
    args = parse_arguments()
    frame_width, frame_height = args.webcam_resolution
    cap = cv2.VideoCapture(0)
    
    # Load YOLO model
    model = YOLO("yolov8n-face.pt", verbose=False)
    
    # Load known face encoding and name
    known_image = face_recognition.load_image_file("./face-images/GörkemKaramolla.jpg")
    known_image_encoding = face_recognition.face_encodings(known_image)[0]
    known_name = "Görkem Karamolla"  # Name of the known person

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
        
        # Process each detected face
        for info in result:
            parameters = info.boxes
            for box in parameters:
                x1, y1, x2, y2 = box.xyxy[0]
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                h, w = y2 - y1, x2 - x1
                
                # Crop face region
                face_region = frame[y1:y2, x1:x2]
                
                # Resize for faster face recognition
                resized_face = cv2.resize(face_region, (128, 128))
                
                # Compute face encoding
                unknown_face_encoding = face_recognition.face_encodings(resized_face)
                
                # Compare with known encoding
                if unknown_face_encoding:
                    unknown_face_encoding = np.array(unknown_face_encoding[0])
                    results = face_recognition.compare_faces([known_image_encoding], unknown_face_encoding)
                    if results[0]:
                        # If known person is recognized, display known name in green color
                        cv2.putText(frame, known_name, (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    else:
                        # If unknown person, display "Unknown" in red color
                        cv2.putText(frame, "Unknown", (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                else:
                    print("No face detected in the given image.")
        
        # Annotate boxes on the frame
        frame = box_annotator.annotate(scene=frame, detections=detections, labels=labels)
        
        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()


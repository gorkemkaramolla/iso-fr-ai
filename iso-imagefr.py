import time
import cv2
import argparse
from ultralytics import YOLO
import supervision as sv
from PIL import Image
import numpy as np
import os
import face_recognition
from datetime import datetime
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
    
 # Load known face encodings and names
    known_images = []
    known_encodings = []
    known_names = []
    known_images_folder = "./face-images/"
    for filename in os.listdir(known_images_folder):
        if filename.endswith(".jpg") or filename.endswith(".jpeg"):
            image_path = os.path.join(known_images_folder, filename)
            known_images.append(face_recognition.load_image_file(image_path))
            known_encodings.append(face_recognition.face_encodings(known_images[-1])[0])
            known_names.append(os.path.splitext(filename)[0])

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
                
                # Compare with known encodings
                if unknown_face_encoding:
                    unknown_face_encoding = np.array(unknown_face_encoding[0])
                    recognized = False
                    for i, known_encoding in enumerate(known_encodings):
                        results = face_recognition.compare_faces([known_encoding], unknown_face_encoding)
                        if results[0]:
                            # If known person is recognized, display known name in green color
                            # Define background color
                            bg_color = (20, 20, 20)

                            # Compute the size of the text
                            text_size = cv2.getTextSize(known_names[i], cv2.FONT_HERSHEY_SIMPLEX, 1.5, 2)[0]

                            # Draw filled rectangle as background
                            cv2.rectangle(frame, (x1, y2 + 20 - text_size[1]), (x1 + text_size[0], y2 + 20), bg_color, -1)

                            # Draw text on top of the background
                            cv2.putText(frame, known_names[i], (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 2)
                            recognized = True
                            break
                    # if not recognized:
                        # If unknown person, display "Unknown" in red color
                        
                else:
                    cv2.putText(frame, "Unknown", (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 0, 255), 2)
                    # curr_time = datetime.now()
                    # formatted_time = curr_time.strftime('%H:%M:%S.%f')
                    # print(formatted_time)
                    # print("Face detected in the given image.")
        
        # Annotate boxes on the frame
        frame = box_annotator.annotate(scene=frame, detections=detections, labels=labels)
        
        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()


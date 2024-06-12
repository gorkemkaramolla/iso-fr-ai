# import cv2
# import numpy as np
# import insightface
# from insightface.app import FaceAnalysis

# # Initialize the face analysis application with SCRFD model for face detection
# app = FaceAnalysis(providers=["CUDAExecutionProvider"])
# app.prepare(ctx_id=0, det_size=(640, 640))


# def detect_gender_and_age(image_path):
#     # Read the input image
#     img = cv2.imread(image_path)
#     img = cv2.resize(img, (1080, 720))
#     # Detect faces
#     faces = app.get(img)

#     draw = app.draw_on(img, faces)

#     cv2.imshow("face", draw)
#     cv2.waitKey(0)
#     cv2.destroyAllWindows()


# # Example usage
# image_path = "../face-images/FatihYavuz.jpg"
# detect_gender_and_age(image_path)

import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis

# Initialize the face analysis application with SCRFD model for face detection
app = FaceAnalysis(providers=["CUDAExecutionProvider"])
app.prepare(ctx_id=0, det_size=(640, 640))


def live_face_recognition():
    # Open the default camera
    cap = cv2.VideoCapture(
        "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile="
    )

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Resize frame for faster processing

        # Detect faces
        faces = app.get(frame)

        # Draw detection results on the frame
        output_frame = app.draw_on(frame, faces)

        # Display the output
        cv2.imshow("Live Face Recognition", output_frame)

        # Break the loop on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # Release the capture and close windows
    cap.release()
    cv2.destroyAllWindows()


# Run the live face recognition
live_face_recognition()

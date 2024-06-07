import cv2

camera_url = 'http://127.0.0.1:5000/video_feed'
cap = cv2.VideoCapture(camera_url)
if not cap.isOpened():
    print("Error: Could not open stream.")
else:
    ret, frame = cap.read()
    if ret:
        cv2.imshow('Frame', frame)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    cap.release()

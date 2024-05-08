import cv2

def capture_camera_stream(ip_camera_url):
    # Set buffer size to 1 frame (might vary by setup)
    cap = cv2.VideoCapture(ip_camera_url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return

    while True:
        ret, frame = cap.read()
        if ret:
            cv2.imshow('IP Camera Stream', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        else:
            break

    cap.release()
    cv2.destroyAllWindows()

capture_camera_stream('rtsp://root:N143g144@192.168.100.152:554/axis-media/media.amp')
# capture_camera_stream('http://root:N143g144@192.168.100.152/mjpg/video.mjpg')

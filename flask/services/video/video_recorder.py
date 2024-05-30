import cv2
import threading

class VideoRecorder:
    def __init__(self, url, output_path):
        self.url = url
        self.output_path = output_path
        self.cap = cv2.VideoCapture(self.url)
        self.out = cv2.VideoWriter(
            self.output_path, 
            cv2.VideoWriter_fourcc(*'XVID'), 
            30.0, 
            (int(self.cap.get(3)), int(self.cap.get(4)))
        )
        self.recording = False
        self.thread = threading.Thread(target=self.record)
        self.thread.daemon = True

    def start(self):
        self.recording = True
        self.thread.start()

    def record(self):
        while self.recording and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                self.out.write(frame)
            else:
                break
        self.cap.release()
        self.out.release()

    def stop(self):
        self.recording = False
        self.thread.join()
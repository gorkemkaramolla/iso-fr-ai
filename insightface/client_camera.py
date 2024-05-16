from flask import Flask, Response
import cv2

app = Flask(__name__)

def generate_frames_cam1():
    # OpenCV capture from camera (change the argument to 0 for the default camera)
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Encode the frame to JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue

        # Yield the encoded frame
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    # Release the capture when done
    cap.release()
def generate_frames_cam2():
    # OpenCV capture from camera (change the argument to 0 for the default camera)
    cap = cv2.VideoCapture(1)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Encode the frame to JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue

        # Yield the encoded frame
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    # Release the capture when done
    cap.release()

@app.route('/cam1')
def stream1():
    # Return a multipart HTTP response with the generated frames
    return Response(generate_frames_cam1(), mimetype='multipart/x-mixed-replace; boundary=frame')
@app.route('/cam2')
def stream2():
    # Return a multipart HTTP response with the generated frames
    return Response(generate_frames_cam2(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='localhost', port=5555, debug=False)

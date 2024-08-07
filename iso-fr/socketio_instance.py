from flask_socketio import SocketIO, join_room, leave_room, emit
import json

socketio = SocketIO(cors_allowed_origins="*")


import numpy as np


def notify_new_face(face):
    # Convert numpy float32 to Python float, if face contains float32 values
    if isinstance(face, dict):
        for key, value in face.items():
            if isinstance(value, np.float32):
                face[key] = float(value)
            if isinstance(value, np.int64):
                face[key] = int(value)
            # Add more conditions here if there are nested structures

    # Emit a new face detection event
    socketio.emit("new_face", face)


def notify_new_camera_url(camera):
    # Emit a new camera URL event
    socketio.emit("new_camera", camera)

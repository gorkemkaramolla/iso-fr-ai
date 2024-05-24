from flask import Flask
from flask_cors import CORS
import os
from routes import audio_bp
from routes import camera_bp
from socketio_instance import socketio

app = Flask(__name__)
CORS(app)

app.register_blueprint(audio_bp)
app.register_blueprint(camera_bp)
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True, port=5004)

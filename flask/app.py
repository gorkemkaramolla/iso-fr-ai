from flask import Flask
from flask_cors import CORS
import os
from routes import audio_bp, camera_bp, system_check, auth_bp
from flask_jwt_extended import JWTManager
from socketio_instance import socketio

app = Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') 
jwt = JWTManager(app)
app.register_blueprint(audio_bp)
app.register_blueprint(camera_bp)
app.register_blueprint(system_check)
app.register_blueprint(auth_bp)

os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True, port=5004)

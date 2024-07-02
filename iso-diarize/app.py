from flask import Flask
from flask_cors import CORS
import os
from routes import (
    audio_bp,
)
import flask.json.provider as provider
from flask_jwt_extended import JWTManager
from socketio_instance import socketio
from datetime import timedelta

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False
CORS(app, origins="*")
app.register_blueprint(audio_bp)
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True, host="0.0.0.0", port=5003, allow_unsafe_werkzeug=True)
    

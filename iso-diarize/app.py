from flask import Flask
from flask_cors import CORS
import os
from routes import audio_bp  # Ensure this module is correctly set up with relevant routes
import flask.json.provider as provider
from flask_jwt_extended import JWTManager
from socketio_instance import socketio  # Ensure this is set up for your real-time features
from datetime import timedelta

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False
CORS(app, origins="*")

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"

# Initialize JWT Manager
jwt = JWTManager(app)

# Register blueprint
app.register_blueprint(audio_bp)

# Ensure necessary directories exist
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True, host="0.0.0.0", port=5003, allow_unsafe_werkzeug=True)

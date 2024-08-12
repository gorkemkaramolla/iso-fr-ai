import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import flask.json.provider as provider
from routes import audio_bp  # Ensure this module is correctly set up with relevant routes
from socketio_instance import socketio  # Ensure this is set up for your real-time features
from config import XMLConfig  # Import the configuration

# Initialize the configuration for the 'speaker_diarization_service'
xml_config = XMLConfig(service_name='speaker_diarization_service')

# Environment setup
os.environ["CURL_CA_BUNDLE"] = ""

# Initialize Flask app
app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False

# Configure CORS using the values from xml_config
CORS(app, origins=xml_config.CORS_ORIGINS, supports_credentials=xml_config.SUPPORTS_CREDENTIALS)

# Configure JWT using the values from xml_config
app.config["JWT_SECRET_KEY"] = xml_config.JWT_SECRET_KEY
app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
app.config["JWT_ACCESS_COOKIE_PATH"] = xml_config.JWT_ACCESS_COOKIE_PATH
app.config["JWT_REFRESH_COOKIE_PATH"] = xml_config.JWT_REFRESH_COOKIE_PATH
app.config["JWT_COOKIE_SECURE"] = xml_config.JWT_COOKIE_SECURE  # Set to False in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = xml_config.JWT_COOKIE_CSRF_PROTECT  # Enable CSRF protection in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = xml_config.get_jwt_expire_timedelta()
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = xml_config.get_jwt_refresh_expire_timedelta()

# Initialize JWT Manager
jwt = JWTManager(app)

# Register blueprint
app.register_blueprint(audio_bp)

# Ensure necessary directories exist
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# Run the application
if __name__ == "__main__":
    socketio.init_app(app, cors_allowed_origins=xml_config.CORS_ORIGINS)
    socketio.run(app, debug=xml_config.FLASK_DEBUG, host=xml_config.FLASK_HOST, port=xml_config.FLASK_PORT, allow_unsafe_werkzeug=True)

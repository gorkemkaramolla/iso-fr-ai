# app.py (or your main application file)
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import flask.json.provider as provider
from routes import (
    system_check,
    solr_search_bp,
    personel_bp
)
from socketio_instance import socketio
from config import XMLConfig
from services.system_monitoring import SystemMonitoring  # Import here instead of within system_monitoring.py

# Initialize the configuration for the 'utils_service'
xml_config = XMLConfig(service_name='utils_service')

# Environment setup
os.environ["CURL_CA_BUNDLE"] = ""

# Initialize Flask app
app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False

# Configure CORS using the values from xml_config
CORS(app, origins=xml_config.CORS_ORIGINS, supports_credentials=xml_config.SUPPORTS_CREDENTIALS)

# Configure JWT using the values from xml_config
app.config["JWT_SECRET_KEY"] = xml_config.JWT_SECRET_KEY
app.config["JWT_TOKEN_LOCATION"] = xml_config.JWT_TOKEN_LOCATION
app.config["JWT_ACCESS_COOKIE_PATH"] = xml_config.JWT_ACCESS_COOKIE_PATH
app.config["JWT_REFRESH_COOKIE_PATH"] = xml_config.JWT_REFRESH_COOKIE_PATH
app.config["JWT_COOKIE_SECURE"] = xml_config.JWT_COOKIE_SECURE  # Set to True in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = xml_config.JWT_COOKIE_CSRF_PROTECT
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = xml_config.get_jwt_expire_timedelta()
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = xml_config.get_jwt_refresh_expire_timedelta()

# Initialize JWT Manager
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(system_check)
app.register_blueprint(solr_search_bp)
app.register_blueprint(personel_bp)

# Ensure necessary directories exist
os.makedirs(xml_config.TEMP_DIRECTORY, exist_ok=True)
os.makedirs(xml_config.LOGGING_COLLECTION, exist_ok=True)

# Initialize socketio with the app
socketio.init_app(app, cors_allowed_origins=xml_config.CORS_ORIGINS, async_mode="gevent")

# Initialize SystemMonitoring after socketio is properly initialized
monitoring_service = SystemMonitoring()

# Run the application
if __name__ == "__main__":
    socketio.run(app, debug=xml_config.FLASK_DEBUG, host=xml_config.FLASK_HOST, port=xml_config.FLASK_PORT, allow_unsafe_werkzeug=True)

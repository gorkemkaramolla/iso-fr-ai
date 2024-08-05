import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes import auth_bp, users_bp
import flask.json.provider as provider
from config import xml_config  # Import the configuration

# Initialize Flask app
app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False

# Configure CORS
CORS(app, origins=xml_config.CORS_ORIGINS, supports_credentials=xml_config.SUPPORTS_CREDENTIALS)

# Set Flask app configuration using the parsed XML values
app.config["JWT_SECRET_KEY"] = xml_config.JWT_SECRET_KEY
app.config["JWT_TOKEN_LOCATION"] = xml_config.JWT_TOKEN_LOCATION
app.config["JWT_ACCESS_COOKIE_PATH"] = xml_config.JWT_ACCESS_COOKIE_PATH
app.config["JWT_REFRESH_COOKIE_PATH"] = xml_config.JWT_REFRESH_COOKIE_PATH
app.config["JWT_COOKIE_SECURE"] = xml_config.JWT_COOKIE_SECURE  # Set to False in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = xml_config.JWT_COOKIE_CSRF_PROTECT  # Enable CSRF protection in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = xml_config.get_jwt_expire_timedelta()
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = xml_config.get_jwt_refresh_expire_timedelta()

# Initialize JWT Manager
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Run the application
if __name__ == "__main__":
    app.run(debug=xml_config.FLASK_DEBUG, port=xml_config.FLASK_PORT, host=xml_config.FLASK_HOST)

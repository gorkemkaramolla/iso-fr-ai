from flask import Flask
from flask_cors import CORS
import os
from routes import (
    system_check,
    solr_search_bp,
    personel_bp
)
import flask.json.provider as provider
from flask_jwt_extended import JWTManager
from socketio_instance import socketio
from datetime import timedelta

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False
CORS(app, origins="*", supports_credentials=True)

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Enable CSRF protection in production




jwt = JWTManager(app)
app.register_blueprint(system_check)
app.register_blueprint(solr_search_bp)
app.register_blueprint(personel_bp)
os.makedirs("logs", exist_ok=True)
if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True,host="0.0.0.0", port=5004, allow_unsafe_werkzeug=True)

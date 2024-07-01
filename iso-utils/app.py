from flask import Flask
from flask_cors import CORS
import os
from routes import (
    system_check,
    solr_search_bp,
)
import flask.json.provider as provider
from flask_jwt_extended import JWTManager
from socketio_instance import socketio
from datetime import timedelta

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False
CORS(app, origins="*")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
jwt = JWTManager(app)
app.register_blueprint(system_check)
app.register_blueprint(solr_search_bp)
os.makedirs("logs", exist_ok=True)
if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True, port=5004)

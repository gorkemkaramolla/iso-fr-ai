from flask import Flask
from flask_cors import CORS
import os
from routes import  camera_bp
import flask.json.provider as provider
from flask_jwt_extended import JWTManager
from socketio_instance import socketio
from datetime import timedelta
app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False
CORS(app,origins="*")
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY') 
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(hours=2)
jwt = JWTManager(app)
app.register_blueprint(camera_bp)
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)

if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True, port=5004)
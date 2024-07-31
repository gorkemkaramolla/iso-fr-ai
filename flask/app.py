from flask import Flask
from flask_cors import CORS
import os
from routes import (
    audio_bp,
    camera_bp,
    system_check,
    auth_bp,
    users_bp,
    elastic_search_bp,
)
import flask.json.provider as provider
from flask_jwt_extended import JWTManager
from socketio_instance import socketio
from datetime import timedelta

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False
CORS(app, origins="*")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(hours=2)
jwt = JWTManager(app)
app.register_blueprint(audio_bp)
app.register_blueprint(camera_bp)
app.register_blueprint(system_check)
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(elastic_search_bp)
os.makedirs("temp", exist_ok=True)
os.makedirs("logs", exist_ok=True)


if __name__ == "__main__":
    import requests

    # URL of the API endpoint
    url = "http://localhost:5004/personel/"

    # Data to be sent in the POST request
    data = {
        "name": "John",
        "lastname": "Doe",
        "email": "john.doe@example.com",
        "image_path": "./face-images/fatih.jpeg"  # Path to the image on the server
    }

    # File to be uploaded (make sure the key matches 'uploadedFile')
    files = {
        "uploadedFile": open("./face-images/fatih.jpeg", "rb")
    }

    # Sending the POST request
    response = requests.post(url, data=data, files=files)
    # Checking the response
    if response.status_code == 200:
        print("Success:", response.json())
    else:
        print("Error:", response.json())

    def get_personel_data():
        url = "http://localhost:5004/personel"
        try:
            response = requests.get(url)
            response.raise_for_status()  # Raise an exception for HTTP errors
            return response.json()  # Return the JSON response
        except requests.exceptions.RequestException as e:
            print(f"An error occurred: {e}")
            return None

  

    data = get_personel_data()
    print(data)    
    # socketio.init_app(app)
    # # socketio.run(app, debug=True, port=5004, host="0.0.0.0")
    # socketio.run(app, debug=True, port=5000, host="192.168.101.81")

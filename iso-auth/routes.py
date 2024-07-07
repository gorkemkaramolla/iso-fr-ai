import json
import bson
import bson.json_util
from flask import Flask, Blueprint, request, jsonify, Response, send_file
import flask.json.provider as provider
from pymongo import MongoClient
from logger import configure_logging
from flask_cors import CORS
from auth.auth_provider import AuthProvider
from flask_jwt_extended import (
    jwt_required,
    JWTManager,
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    get_jwt,
    get_jwt_identity,
    unset_jwt_cookies
)
import os
from datetime import timedelta, datetime, timezone
from bson.objectid import ObjectId
import io
import binascii
import numpy as np

from config import BINARY_MATCH

app = Flask(__name__)
provider.DefaultJSONProvider.sort_keys = False

CORS(app, origins="*", supports_credentials=True)
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
app.config['JWT_REFRESH_COOKIE_PATH'] = '/token/refresh'
app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = True  # Enable CSRF protection in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=int(os.getenv("JWT_EXPIRE_SECONDS")) or 60)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(hours=2)

jwt = JWTManager(app)

###################################################### Setup MongoDB
client = MongoClient(os.environ.get("MONGO_DB_URI"))
db = client[os.environ.get("MONGO_DB_NAME")]
logs_collection = db["logs"]
camera_collection = db["cameras"]

##################################################### Create an instance of your class
logger = configure_logging()

# Setup Blueprint
auth_bp = Blueprint("auth_bp", __name__)
users_bp = Blueprint("users_bp", __name__)

@users_bp.route("/users/images", methods=["GET"])
def get_user_images():
    personel = list(
        db.get_collection("Personel").find(
            {}, {"FOTO_BINARY_DATA": 1, "ADI": 1, "SOYADI": 1}
        )
    )
    for i, person in enumerate(personel):
        try:
            if (
                person.get("FOTO_BINARY_DATA")
                and person.get("FOTO_BINARY_DATA") != BINARY_MATCH
            ):
                hex_data = person.get("FOTO_BINARY_DATA")
                binary_data = binascii.unhexlify(hex_data)
                nparr = np.frombuffer(binary_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if not os.path.exists("images"):
                    os.makedirs("images")
                adi = person.get("ADI", "unknown")
                soyadi = person.get("SOYADI", "unknown")
                cv2.imwrite(f"images/{adi}{soyadi}.jpeg", image)
        except Exception as e:
            print(f"Image {i} is corrupted, skipping... Error: {str(e)}")
            continue
    return "Images saved", 200

@users_bp.route('/testix', methods=['GET'])
@jwt_required()
def testix():
    # Access the 'Cookie' header directly
    cookie_header = request.headers.get('Cookie', 'Unknown')
    
    # Access cookies using request.cookies, which is a dictionary
    cookies = request.cookies  # This is a dictionary of all cookies
    
    # Prepare the response data
    response_data = {
        'CookieHeader': cookie_header,
        'Cookies': cookies
    }
    
    # Return the data as a JSON response
    return jsonify(response_data), 200

@users_bp.route("/users", methods=["GET"])
def get_users():
    personel = list(db.get_collection("Personel").find())
    for person in personel:
        person.pop("_id", None)  # Remove _id from the dictionary
    return jsonify(personel), 200

app.register_blueprint(users_bp)

auth_provider = AuthProvider()

@auth_bp.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            set_access_cookies(response, access_token)
        return response
    except (RuntimeError, KeyError):
        return response

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    response = auth_provider.register(username, password)
    return response

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    tokens = auth_provider.login(username, password)

    response = jsonify({"message": "Login successful"})
    
    set_access_cookies(response, tokens["access_token"], max_age=int(os.getenv("JWT_EXPIRES_SECONDS") or 60))
    return response, 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify()
    unset_jwt_cookies(response)
    return response, 200

app.register_blueprint(auth_bp)


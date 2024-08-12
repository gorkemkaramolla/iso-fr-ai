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
from datetime import timedelta, datetime, timezone
from bson.objectid import ObjectId
import io
import binascii
import numpy as np
import cv2

from config import XMLConfig  # Import the XML configuration


# Initialize Flask app
app = Flask(__name__)
xml_config = XMLConfig(service_name='auth_service')
xml_mongo_config = XMLConfig(service_name='mongo')

provider.DefaultJSONProvider.sort_keys = False

# Configure CORS
CORS(app, origins=xml_config.CORS_ORIGINS, supports_credentials=xml_config.SUPPORTS_CREDENTIALS)

# Set Flask app configuration using the parsed XML values
app.config["JWT_SECRET_KEY"] = xml_config.JWT_SECRET_KEY
app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
app.config["JWT_ACCESS_COOKIE_PATH"] = xml_config.JWT_ACCESS_COOKIE_PATH
app.config["JWT_REFRESH_COOKIE_PATH"] = xml_config.JWT_REFRESH_COOKIE_PATH
app.config["JWT_COOKIE_SECURE"] = xml_config.JWT_COOKIE_SECURE  # Set to False in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = xml_config.JWT_COOKIE_CSRF_PROTECT  # Enable CSRF protection in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = xml_config.get_jwt_expire_timedelta()
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = xml_config.get_jwt_refresh_expire_timedelta()

jwt = JWTManager(app)

###################################################### Setup MongoDB
client = MongoClient(xml_mongo_config.MONGO_DB_URI)
db = client[xml_mongo_config.MONGO_DB_NAME]
##################################################### Create an instance of your class
logger = configure_logging()

# Setup Blueprint
auth_bp = Blueprint("auth_bp", __name__)
users_bp = Blueprint("users_bp", __name__)

@users_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    current_user = get_jwt_identity()
    if not current_user.get('role') == 'admin':
        return jsonify({"msg": "Access forbidden: Admins only"}), 403

    users = list(db.get_collection("users").find())
    
    for user in users:
        user['id'] = str(user.pop("_id"))  # Rename _id to id and convert to string
        user.pop("password", None)  

    return jsonify(users), 200


app.register_blueprint(users_bp)

auth_provider = AuthProvider()

# @auth_bp.after_request
# def refresh_expiring_jwts(response):
#     try:
#         exp_timestamp = get_jwt()["exp"]
#         now = datetime.now(timezone.utc)
#         target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
#         if target_timestamp > exp_timestamp:
#             access_token = create_access_token(identity=get_jwt_identity())
#             set_access_cookies(response, access_token)
#         return response
#     except (RuntimeError, KeyError):
#         return response

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    role = data.get("role", "user")
    if not username or not password or not email:
        return jsonify({"error": "Username, password, and email are required"}), 400

    response = auth_provider.register(username, password, email, role)
    return response

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    tokens = auth_provider.login(username, password)
    if isinstance(tokens, tuple):  # Check if tokens is a tuple indicating an error
        return tokens

    response = jsonify({"message": "Login successful","access_token":tokens["access_token"],"refresh_token":tokens["refresh_token"]})
    

    # Set the HTTP-only access token cookie
    set_access_cookies(response, tokens["access_token"], max_age=int(xml_config.JWT_EXPIRE_SECONDS))

    # Set the HTTP-only refresh token cookie
    set_refresh_cookies(response, tokens["refresh_token"])

    # Set an additional non-HTTP-only cookie with the same expiration date
    response.set_cookie(
        'client_access_token',  # This can be any name you choose
        tokens["access_token"],  # The value of the token
        max_age=int(xml_config.JWT_EXPIRE_SECONDS),  # Same expiration time as the access token
        secure=xml_config.JWT_COOKIE_SECURE,  # Secure flag depending on your environment
        httponly=False,  # This makes the cookie accessible via JavaScript
        samesite='Lax',  # Adjust based on your needs
        path=xml_config.JWT_ACCESS_COOKIE_PATH
    )

    return response, 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    response = auth_provider.refresh_token()
    set_access_cookies(response, response.get_json()["access_token"])
    return response

@auth_bp.route("/add_user", methods=["POST"])
@jwt_required()
def add_user():
    current_user = get_jwt_identity()
    if current_user["role"] != "admin":
        return jsonify({"error": "Permission denied"}), 403

    data = request.json
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    role = data.get("role", "user")
    if not username or not password or not email:
        return jsonify({"error": "Username, password, and email are required"}), 400

    response = auth_provider.add_user(username, password, email, role)
    return response

@auth_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    current_user = get_jwt_identity()
    if current_user["role"] != "admin":
        return jsonify({"error": "Permission denied"}), 403

    if not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid user ID"}), 400

    user = db.get_collection("users").find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    result = db.get_collection("users").delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        return jsonify({"message": "User deleted successfully"}), 200
    else:
        return jsonify({"error": "Failed to delete user"}), 500

@auth_bp.route("/update_user", methods=["PUT"])
@jwt_required()
def update_user():
    current_user = get_jwt_identity()
    if current_user["role"] != "admin":
        return jsonify({"error": "Permission denied"}), 403

    data = request.json
    username = data.get("username")
    new_password = data.get("new_password")
    new_email = data.get("new_email")
    if not username or not new_password:
        return jsonify({"error": "Username and new password are required"}), 400

    response = auth_provider.update_user(username, new_password, new_email)
    return response

app.register_blueprint(auth_bp)

from db import mongo_client, mongo_db
from flask import jsonify, request
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

class AuthProvider:
    def __init__(self):
        self.client = mongo_client
        self.db = mongo_db
    
    def login(self, username, password):
        users_collection = self.db["users"]
        user = users_collection.find_one({"username": username})
        if not user or not check_password_hash(user["password"], password):
            return jsonify({"message": "Invalid credentials"}), 401
        access_token = create_access_token(identity={"username": username})
        return jsonify({"access_token": access_token}), 200
    
    def register(self, username, password):
        users_collection = self.db["users"]
        if users_collection.find_one({"username": username}):
            return jsonify({"message": "Username already exists"}), 400
        
        hashed_password = generate_password_hash(password)
        user_data = {
            "username": username,
            "password": hashed_password
        }
        users_collection.insert_one(user_data)
        return jsonify({"message": "User registered successfully"}), 201

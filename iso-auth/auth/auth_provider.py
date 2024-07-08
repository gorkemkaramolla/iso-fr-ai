from db import mongo_client, mongo_db
from flask import jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token,get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta
class AuthProvider:
    def __init__(self):
        self.client = mongo_client
        self.db = mongo_db
    
    def login(self, username, password):
        users_collection = self.db["users"]
        user = users_collection.find_one({"username": username})
        print(user)
        if not user or not check_password_hash(user["password"], password):
            return None
        access_token = create_access_token(identity={"username": username})
        refresh_token = create_refresh_token(identity={"username": username})
        
        return {"access_token": access_token, "refresh_token": refresh_token}
    
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
    
    def refresh_token(self):
        current_user = get_jwt_identity()
        new_token = create_access_token(identity=current_user)
        return new_token
    
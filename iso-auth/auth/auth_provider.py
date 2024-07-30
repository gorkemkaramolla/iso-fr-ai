from db import mongo_client, mongo_db
from flask import jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash

class AuthProvider:
    def __init__(self):
        self.client = mongo_client
        self.db = mongo_db
    
    def login(self, username, password):
        users_collection = self.db["users"]
        user = users_collection.find_one({"username": username})
        if not user or not check_password_hash(user["password"], password):
            return jsonify({"message": "Invalid username or password"}), 401
        
        access_token = create_access_token(identity={"username": username, "role": user["role"]})
        refresh_token = create_refresh_token(identity={"username": username, "role": user["role"]})
        return {"access_token": access_token, "refresh_token": refresh_token}
    
    def register(self, username, password, email, role='user'):
        users_collection = self.db["users"]
        if users_collection.find_one({"username": username}):
            return jsonify({"message": "Username already exists"}), 400
        
        hashed_password = generate_password_hash(password)
        user_data = {
            "username": username,
            "password": hashed_password,
            "email": email,
            "role": role
        }
        users_collection.insert_one(user_data)
        return jsonify({"message": "User registered successfully"}), 201
    
    def refresh_token(self):
        current_user = get_jwt_identity()
        new_token = create_access_token(identity=current_user)
        return jsonify({"access_token": new_token}), 200
    
    def add_user(self, username, password, email, role='user'):
        users_collection = self.db["users"]
        if users_collection.find_one({"username": username}):
            return jsonify({"message": "Username already exists"}), 400
        
        hashed_password = generate_password_hash(password)
        user_data = {
            "username": username,
            "password": hashed_password,
            "email": email,
            "role": role
        }
        users_collection.insert_one(user_data)
        return jsonify({"message": "User added successfully"}), 201
    
    def delete_user(self, username):
        users_collection = self.db["users"]
        result = users_collection.delete_one({"username": username})
        if result.deleted_count == 0:
            return jsonify({"message": "User not found"}), 404
        return jsonify({"message": "User deleted successfully"}), 200
    
    def update_user(self, username, new_password, new_email=None):
        users_collection = self.db["users"]
        hashed_password = generate_password_hash(new_password)
        update_data = {"password": hashed_password}
        if new_email:
            update_data["email"] = new_email
        
        result = users_collection.update_one(
            {"username": username},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            return jsonify({"message": "User not found"}), 404
        return jsonify({"message": "User updated successfully"}), 200

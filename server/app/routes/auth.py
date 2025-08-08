from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user
from app import mongo
from app.models import User
import bcrypt
from bson.objectid import ObjectId

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(force=True)
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({'error': 'Missing required fields'}), 400

    if mongo.db.users.find_one({"username": username}):
        return jsonify({'error': 'Username already exists'}), 409
    if mongo.db.users.find_one({"email": email}):
        return jsonify({'error': 'Email already registered'}), 409
    
    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Insert the new user document into the 'users' collection
    user_id = mongo.db.users.insert_one({
        'username': username,
        'email': email,
        'password': hashed_password,
        'friends': [] # Start with an empty list of friends
    }).inserted_id

    # Log the user in immediately
    user_doc = mongo.db.users.find_one({"_id": user_id})
    user_obj = User(user_doc)
    login_user(user_obj, remember=True)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': { 'id': str(user_id), 'username': username, 'unique_id': str(user_id) }
    }), 201


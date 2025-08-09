from flask import Blueprint, jsonify
from app import mongo
from bson.objectid import ObjectId

bp = Blueprint('users', __name__)

@bp.route('/<string:username>')
def get_user_profile(username):
    # Use mongo.db.users.find_one() instead of the old SQL query
    user_doc = mongo.db.users.find_one({"username": username})
    
    if not user_doc:
        return jsonify({"error": "User not found"}), 404

    # Return only public information
    profile_data = {
        "username": user_doc.get('username'),
        "unique_id": str(user_doc.get('_id')),
    }
    return jsonify(profile_data)

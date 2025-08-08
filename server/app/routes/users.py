from flask import Blueprint, jsonify
from ..models import User

bp = Blueprint('users', __name__)

@bp.route('/<string:username>')
def get_user_profile(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Return only public information
    profile_data = {
        "username": user.username,
        "unique_id": user.unique_id,
    }
    return jsonify(profile_data)
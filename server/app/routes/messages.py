from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app import mongo
from bson.objectid import ObjectId

bp = Blueprint('messages', __name__)

@bp.route('/global')
@login_required
def get_global_message_history():
    """Fetches the global message history from MongoDB."""
    messages_cursor = mongo.db.messages.find({'is_global': True}).sort('timestamp', 1).limit(100)
    
    message_list = []
    for msg in messages_cursor:
        sender = mongo.db.users.find_one({'_id': msg['sender_id']})
        if sender:
            message_list.append({
                "id": str(msg['_id']),
                "content": msg['content'],
                "timestamp": msg['timestamp'].isoformat(),
                "is_global": True,
                "sender": {
                    "id": str(sender['_id']),
                    "username": sender['username']
                }
            })
    return jsonify(message_list)

@bp.route('/<string:friend_unique_id>')
@login_required
def get_message_history(friend_unique_id):
    """Fetches private message history with a specific friend."""
    user_id = ObjectId(current_user.get_id())
    friend_id = ObjectId(friend_unique_id)

    # Find messages between the two users
    messages_cursor = mongo.db.messages.find({
        'is_global': False,
        '$or': [
            {'sender_id': user_id, 'recipient_id': friend_id},
            {'sender_id': friend_id, 'recipient_id': user_id}
        ]
    }).sort('timestamp', 1)

    message_list = [{
        "id": str(msg['_id']),
        "sender_id": str(msg['sender_id']),
        "recipient_id": str(msg['recipient_id']),
        "content": msg['content'],
        "timestamp": msg['timestamp'].isoformat()
    } for msg in messages_cursor]

    return jsonify(message_list)
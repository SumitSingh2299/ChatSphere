from flask import request
from flask_login import current_user
from flask_socketio import emit, join_room, leave_room
from app import mongo, socketio
from bson.objectid import ObjectId
from datetime import datetime, timezone

GLOBAL_ROOM = 'global_chat'

@socketio.on('connect')
def handle_connect():
    if current_user.is_authenticated:
        join_room(current_user.get_id())
    join_room(GLOBAL_ROOM)

@socketio.on('disconnect')
def handle_disconnect():
    if current_user.is_authenticated:
        leave_room(current_user.get_id())

@socketio.on('send_message')
def handle_send_message(data):
    if not current_user.is_authenticated: return

    recipient_id = ObjectId(data.get('recipient_unique_id'))
    content = data.get('content')
    if not recipient_id or not content: return

    sender_id = ObjectId(current_user.get_id())
    
    message_doc = {
        'sender_id': sender_id,
        'recipient_id': recipient_id,
        'content': content,
        'timestamp': datetime.now(timezone.utc),
        'is_global': False
    }
    result = mongo.db.messages.insert_one(message_doc)
    
    message_data = {
        'id': str(result.inserted_id),
        'sender_id': str(sender_id),
        'recipient_id': str(recipient_id),
        'content': content,
        'timestamp': message_doc['timestamp'].isoformat()
    }

    emit('receive_message', message_data, room=str(recipient_id))
    emit('receive_message', message_data, room=str(sender_id))

@socketio.on('send_global_message')
def handle_send_global_message(data):
    if not current_user.is_authenticated: return

    content = data.get('content')
    if not content: return

    sender_id = ObjectId(current_user.get_id())

    message_doc = {
        'sender_id': sender_id,
        'recipient_id': None,
        'content': content,
        'timestamp': datetime.now(timezone.utc),
        'is_global': True
    }
    result = mongo.db.messages.insert_one(message_doc)

    message_data = {
        'id': str(result.inserted_id),
        'content': content,
        'timestamp': message_doc['timestamp'].isoformat(),
        'is_global': True,
        'sender': {'id': str(sender_id), 'username': current_user.username}
    }
    
    emit('receive_global_message', message_data, room=GLOBAL_ROOM)
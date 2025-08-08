from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import mongo
from bson.objectid import ObjectId

bp = Blueprint('friends', __name__)

@bp.route('/list')
@login_required
def get_friends():
    """Returns the current user's list of friends using MongoDB."""
    user_id = ObjectId(current_user.get_id())
    
    # MongoDB Aggregation Pipeline to find friends and get their details
    pipeline = [
        # 1. Start with the current user
        {'$match': {'_id': user_id}},
        # 2. Deconstruct the 'friends' array
        {'$unwind': '$friends'},
        # 3. "Join" with the users collection to get friend details
        {'$lookup': {
            'from': 'users',
            'localField': 'friends',
            'foreignField': '_id',
            'as': 'friend_details'
        }},
        # 4. Deconstruct the resulting friend_details array
        {'$unwind': '$friend_details'},
        # 5. Format the output
        {'$project': {
            '_id': 0,
            'username': '$friend_details.username',
            'unique_id': {'$toString': '$friend_details._id'}
        }}
    ]
    friends_list = list(mongo.db.users.aggregate(pipeline))
    return jsonify(friends_list)


@bp.route('/pending')
@login_required
def get_pending_requests():
    """Returns pending friend requests for the current user."""
    user_id = ObjectId(current_user.get_id())
    
    # Find requests where the current user is the recipient
    requests = mongo.db.friend_requests.find({'to_user_id': user_id, 'status': 'pending'})
    
    pending_list = []
    for req in requests:
        from_user = mongo.db.users.find_one({'_id': req['from_user_id']})
        if from_user:
            pending_list.append({
                'request_id': str(req['_id']),
                'from_user': {
                    'username': from_user['username'],
                    'unique_id': str(from_user['_id'])
                }
            })
    return jsonify(pending_list)


@bp.route('/send_request/<string:user_unique_id>', methods=['POST'])
@login_required
def send_friend_request(user_unique_id):
    """Sends a friend request to another user."""
    from_user_id = ObjectId(current_user.get_id())
    to_user_id = ObjectId(user_unique_id)

    if from_user_id == to_user_id:
        return jsonify({'error': 'You cannot send a friend request to yourself'}), 400

    # Check if a request already exists or if they are already friends
    if mongo.db.friend_requests.find_one({
        '$or': [
            {'from_user_id': from_user_id, 'to_user_id': to_user_id},
            {'from_user_id': to_user_id, 'to_user_id': from_user_id}
        ]
    }):
        return jsonify({'error': 'A friend request is already pending or you are already friends'}), 409

    # Create a new friend request document
    mongo.db.friend_requests.insert_one({
        'from_user_id': from_user_id,
        'to_user_id': to_user_id,
        'status': 'pending'
    })

    return jsonify({'message': 'Friend request sent successfully'}), 201


@bp.route('/respond/<string:request_id>', methods=['POST'])
@login_required
def respond_to_request(request_id):
    """Responds to a friend request (accept or decline)."""
    response = request.args.get('response', 'decline').lower()
    req_obj_id = ObjectId(request_id)
    user_id = ObjectId(current_user.get_id())

    friend_request = mongo.db.friend_requests.find_one({'_id': req_obj_id, 'to_user_id': user_id})

    if not friend_request:
        return jsonify({'error': 'Invalid request'}), 404

    if response == 'accept':
        # Update the request status
        mongo.db.friend_requests.update_one({'_id': req_obj_id}, {'$set': {'status': 'accepted'}})
        
        # Add each user to the other's friends list
        from_user_id = friend_request['from_user_id']
        to_user_id = friend_request['to_user_id']
        mongo.db.users.update_one({'_id': from_user_id}, {'$addToSet': {'friends': to_user_id}})
        mongo.db.users.update_one({'_id': to_user_id}, {'$addToSet': {'friends': from_user_id}})
        
        return jsonify({'message': 'Friend request accepted'}), 200
    else:
        # Just update the status to declined
        mongo.db.friend_requests.update_one({'_id': req_obj_id}, {'$set': {'status': 'declined'}})
        return jsonify({'message': 'Friend request declined'}), 200


@bp.route('/search')
@login_required
def search_users():
    """Searches for users by username."""
    query = request.args.get('username', '')
    if not query:
        return jsonify([]), 200
    
    current_user_id = ObjectId(current_user.get_id())
    
    # Find users whose username starts with the query, case-insensitive, and is not the current user
    users_cursor = mongo.db.users.find({
        'username': {'$regex': f'^{query}', '$options': 'i'},
        '_id': {'$ne': current_user_id}
    }).limit(10)
    
    user_list = [{
        'unique_id': str(user['_id']),
        'username': user['username']
    } for user in users_cursor]
    
    return jsonify(user_list)
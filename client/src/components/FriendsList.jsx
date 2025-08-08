import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Use the correct relative path
import UserSearch from './UserSearch';

const FriendsList = ({ onNotification, onSelectFriend }) => {
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [friendsRes, pendingRes] = await Promise.all([
                api.get('/friends/list'),
                api.get('/friends/pending')
            ]);
            setFriends(friendsRes.data);
            setPendingRequests(pendingRes.data);
        } catch (error) {
            console.error("Failed to fetch friends data:", error);
            onNotification({ type: 'error', message: 'Could not load friends list.' });
        } finally {
            setLoading(false);
        }
    }, [onNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRespondRequest = async (requestId, response) => {
        try {
            await api.post(`/friends/respond/${requestId}?response=${response}`);
            onNotification({ type: 'success', message: `Friend request ${response}ed.` });
            await fetchData();
        } catch (error) {
            console.error(`Failed to ${response} friend request:`, error);
            onNotification({ type: 'error', message: 'Action failed. Please try again.' });
        }
    };

    return (
        <>
            <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">Add Friend</h3>
                <UserSearch onNotification={onNotification} />
            </div>

            {pendingRequests.length > 0 && (
                <div className="border-t border-b border-gray-700 py-4 my-4">
                    <h3 className="text-lg font-bold mb-2 text-yellow-500">Pending Requests</h3>
                    <ul className="space-y-2">
                        {pendingRequests.map(req => (
                            <li key={req.request_id} className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
                                <span className="font-semibold">{req.from_user.username}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRespondRequest(req.request_id, 'accept')} className="px-2 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded">Accept</button>
                                    <button onClick={() => handleRespondRequest(req.request_id, 'decline')} className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded">Decline</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h3 className="text-lg font-bold mb-2">Friends ({friends.length})</h3>
                <div className="mb-2">
                     <button 
                        onClick={() => onSelectFriend({ unique_id: 'global', username: '🌎 Global Chat' })} 
                        className="w-full text-left p-2 bg-green-800 rounded-md font-semibold hover:bg-green-500 hover:text-white transition-colors"
                    >
                        🌎 Global Chat
                    </button>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : friends.length > 0 ? (
                    <ul className="space-y-2">
                        {friends.map(friend => (
                            <li key={friend.unique_id}>
                                <button 
                                    onClick={() => onSelectFriend(friend)} 
                                    className="w-full text-left p-2 bg-gray-700 rounded-md font-semibold hover:bg-blue-500 hover:text-white transition-colors"
                                >
                                    {friend.username}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">You have no friends yet. Add some!</p>
                )}
            </div>
        </>
    );
};

export default FriendsList;
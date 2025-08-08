import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const PrivateMessageWindow = ({ room, userData, friends, onBack, onNotification }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!room) return;

        // Establish WebSocket connection for the selected private room
        ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${room.id}?user_id=${userData.id}`);

        ws.current.onopen = () => console.log(`Private chat WS connected to room ${room.id}`);
        
        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prev => [...prev, message]);
        };

        ws.current.onclose = () => console.log(`Private chat WS disconnected from room ${room.id}`);
        ws.current.onerror = (error) => console.error(`Private chat WS error in room ${room.id}:`, error);

        // Clean up the connection when the component unmounts or the room changes
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [room, userData.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
            const messagePayload = {
                room_id: room.id,
                author_id: userData.id,
                author_username: userData.username,
                content: newMessage,
                createdAt: new Date().toISOString(),
            };
            ws.current.send(JSON.stringify(messagePayload));
            setNewMessage('');
        }
    };

    const handleInviteFriends = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/chatrooms/${room.id}/invite`, selectedFriends);
            onNotification({ type: 'success', message: 'Friends invited successfully!' });
            setIsInviting(false);
            setSelectedFriends([]);
        } catch (error) {
            console.error("Failed to invite friends:", error);
            onNotification({ type: 'error', message: 'Failed to invite friends.' });
        }
    };

    const handleFriendSelection = (friendId) => {
        setSelectedFriends(prev => 
            prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
        );
    };

    if (!room) {
        return <div className="flex justify-center items-center h-full bg-gray-100 dark:bg-gray-900 rounded-lg"><p>Select a room to start chatting.</p></div>;
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <button onClick={onBack} className="mr-4 text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back</button>
                    <h2 className="text-xl font-bold inline">{room.name}</h2>
                </div>
                <button onClick={() => setIsInviting(!isInviting)} className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    {isInviting ? 'Cancel' : 'Invite'}
                </button>
            </div>

            {/* Invite Panel */}
            {isInviting && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleInviteFriends}>
                        <h4 className="font-bold mb-2">Select friends to invite:</h4>
                        <div className="max-h-32 overflow-y-auto mb-2 space-y-1">
                            {friends.map(friend => (
                                <div key={friend.unique_id}>
                                    <label className="flex items-center gap-2 p-1">
                                        <input type="checkbox" checked={selectedFriends.includes(friend.id)} onChange={() => handleFriendSelection(friend.id)} />
                                        {friend.username}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="w-full px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Invite Selected</button>
                    </form>
                </div>
            )}

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-4 flex ${msg.author_id === userData.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.author_id === userData.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <div className="text-sm font-bold">{msg.author_username}</div>
                            <p className="break-words">{msg.content}</p>
                            <div className="text-xs opacity-70 mt-1 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow px-3 py-2 text-gray-900 bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <button type="submit" className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700" disabled={!newMessage.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PrivateMessageWindow;
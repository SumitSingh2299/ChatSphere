import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PrivateChatWindow = ({ onSelectRoom, friends }) => {
    const [chatRooms, setChatRooms] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchChatRooms = async () => {
        // This endpoint doesn't exist yet, so we'll mock it for now.
        // In a real implementation, you'd fetch rooms the user is a member of.
        // For now, we'll just show a "Create Room" button.
        setLoading(false);
    };

    useEffect(() => {
        fetchChatRooms();
    }, []);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;
        try {
            const response = await api.post('/chatrooms/create', { name: newRoomName.trim() });
            setChatRooms(prev => [...prev, response.data]);
            setNewRoomName('');
            setIsCreating(false);
            // Automatically select the new room
            onSelectRoom(response.data);
        } catch (error) {
            console.error("Failed to create chat room:", error);
            // You could pass an onNotification prop here as well
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Private Chats</h3>
                <button 
                    onClick={() => setIsCreating(!isCreating)} 
                    className="px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    {isCreating ? 'Cancel' : '+ New'}
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreateRoom} className="flex flex-col gap-2 p-2 border rounded-md">
                     <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter new room name..."
                        className="flex-grow px-3 py-2 text-sm text-gray-900 bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <button type="submit" className="w-full px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                        Create Room
                    </button>
                </form>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex-grow overflow-y-auto">
                {loading ? (
                    <p>Loading chat rooms...</p>
                ) : chatRooms.length > 0 ? (
                    <ul className="space-y-2">
                        {chatRooms.map(room => (
                            <li 
                                key={room.id} 
                                onClick={() => onSelectRoom(room)}
                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-700"
                            >
                                {room.name}
                            </li>
                        ))}
                    </ul>
                ) : (
                    !isCreating && <p className="text-sm text-gray-500">No private chats. Create one!</p>
                )}
            </div>
        </div>
    );
};

export default PrivateChatWindow;
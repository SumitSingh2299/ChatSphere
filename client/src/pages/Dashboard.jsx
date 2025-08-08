import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FriendsList from '../components/FriendsList';
import ChatWindow from '../components/ChatWindow';
import Notification from '../components/Notification';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext'; // 1. Import the useAuth hook

const Dashboard = () => {
    const [notification, setNotification] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);
    
    // 2. Get user and logout function directly from the context
    const { user: currentUser, logout } = useAuth();
    const socket = useSocket();

    const handleNotification = (noti) => {
        setNotification(noti);
        setTimeout(() => setNotification(null), 5000);
    };

    const handleSelectFriend = (friend) => {
        setSelectedChat(friend);
    };

    // Show a loading/redirecting state if the user isn't loaded yet
    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading Session...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            {notification && <Notification message={notification.message} type={notification.type} />}
            
            <div className="w-1/4 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
                <div className="mb-4 pb-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            Welcome,{' '}
                            <Link to={`/profile/${currentUser.username}`} className="text-blue-400 hover:underline">
                                {currentUser.username}
                            </Link>
                        </h2>
                        <button
                            onClick={logout} // 3. Use the logout function from the context
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    <FriendsList 
                        onNotification={handleNotification}
                        onSelectFriend={handleSelectFriend}
                    />
                </div>
            </div>

            <div className="w-3/4 flex flex-col">
                <ChatWindow 
                    socket={socket}
                    selectedChat={selectedChat}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
};

export default Dashboard;
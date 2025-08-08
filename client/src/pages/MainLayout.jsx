import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import GlobalChatWindow from '../components/GlobalChatWindow';
import FriendsList from '../components/FriendsList';
import PrivateChatWindow from '../components/PrivateChatWindow';
import PrivateMessageWindow from '../components/PrivateMessageWindow';

const NotificationsPanel = ({ notifications, onClose }) => (
    <div className="absolute top-16 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-80 border border-gray-200 dark:border-gray-700 z-10">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Notifications</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
        </div>
        {notifications.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto">
                {notifications.map((notif, index) => (
                    <li key={index} className="p-2 border-b border-gray-200 dark:border-gray-700 text-sm">{notif.message}</li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-500">No new notifications.</p>
        )}
    </div>
);

const ToastNotification = ({ notification, onDismiss }) => {
    if (!notification) return null;

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 3000);
        return () => clearTimeout(timer);
    }, [notification, onDismiss]);

    const bgColor = notification.type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white shadow-lg ${bgColor}`}>
            {notification.message}
        </div>
    );
};


const MainLayout = () => {
    const { logout } = useContext(AuthContext);
    const [userData, setUserData] = useState(null);
    const [friends, setFriends] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [userRes, friendsRes] = await Promise.all([
                    api.get('/users/me'),
                    api.get('/friends/list')
                ]);
                
                setUserData(userRes.data);
                setFriends(friendsRes.data);
                
                const userId = userRes.data.id;
                const ws = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}`);

                ws.onopen = () => console.log('Notification WebSocket connected');
                ws.onmessage = (event) => {
                    try {
                        const notification = JSON.parse(event.data);
                        setNotifications(prev => [notification, ...prev]);
                        if (notification.type === 'friend_request') {
                            setToast({ type: 'success', message: notification.message });
                        }
                    } catch (e) {
                        console.error("Failed to parse notification", e)
                    }
                };
                ws.onclose = () => console.log('Notification WebSocket disconnected');
                ws.onerror = (error) => console.error('Notification WebSocket error:', error);

                return () => ws.close();

            } catch (error) {
                console.error("Failed to fetch initial data", error);
                logout();
            }
        };

        fetchInitialData();
    }, [logout]);

    if (!userData) {
        return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading user data...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <ToastNotification notification={toast} onDismiss={() => setToast(null)} />
            <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
                <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">ChatSphere</h1>
                <div className="flex items-center gap-4">
                    {/* Updated Welcome message to be a link */}
                    <Link to={`/profile/${userData.unique_id}`} className="font-semibold hover:underline">
                        Welcome, {userData.username}! <span className="text-gray-500 text-sm">({userData.unique_id})</span>
                    </Link>
                    <div className="relative">
                        <button onClick={() => setShowNotifications(prev => !prev)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                           {notifications.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{notifications.length}</span>}
                        </button>
                        {showNotifications && <NotificationsPanel notifications={notifications} onClose={() => setShowNotifications(false)} />}
                    </div>
                    <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold">
                        Logout
                    </button>
                </div>
            </header>

            <main className="flex-grow p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                    <FriendsList onNotification={setToast} />
                </div>
                <div className="md:col-span-2">
                    {selectedRoom ? (
                        <PrivateMessageWindow 
                            room={selectedRoom} 
                            userData={userData}
                            friends={friends}
                            onBack={() => setSelectedRoom(null)}
                            onNotification={setToast}
                        />
                    ) : (
                        <GlobalChatWindow userData={userData} />
                    )}
                </div>
                <div className="md:col-span-1">
                    <PrivateChatWindow onSelectRoom={setSelectedRoom} friends={friends} />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
import React, { useState, useEffect, useRef } from 'react';

const GlobalChatWindow = ({ userData }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Establish WebSocket connection for the global chat.
        // We pass the user ID as a query param for potential server-side logic, though not strictly needed for broadcasting.
        ws.current = new WebSocket(`ws://localhost:8000/ws/chat/global?user_id=${userData.id}`);

        ws.current.onopen = () => console.log('Global chat WebSocket connected');
        
        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // The server broadcasts the message it received, so we add it to our state.
                setMessages(prevMessages => [...prevMessages, message]);
            } catch (e) {
                console.error("Failed to parse incoming message:", e);
            }
        };

        ws.current.onclose = () => console.log('Global chat WebSocket disconnected');
        ws.current.onerror = (error) => console.error('Global chat WebSocket error:', error);

        // Clean up the connection when the component unmounts
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [userData.id]);

    useEffect(() => {
        // Scroll to the bottom whenever the messages array is updated
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
            // The payload sent to the server must match the structure it will broadcast back.
            // The server will add the `createdAt` timestamp.
            const messagePayload = {
                room_id: 'global',
                author_id: userData.id,
                author_username: userData.username,
                content: newMessage,
                // We add a temporary createdAt for immediate display, but the server's version is the source of truth.
                createdAt: new Date().toISOString(), 
            };
            ws.current.send(JSON.stringify(messagePayload));
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold">Global Chat</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Messages here are public and deleted after 1 hour.</p>
            </div>
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow px-3 py-2 text-gray-900 bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <button type="submit" className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={!newMessage.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GlobalChatWindow;
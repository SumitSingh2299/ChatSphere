import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Use the correct relative path

const ChatWindow = ({ socket, selectedChat, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const isGlobalChat = selectedChat?.unique_id === 'global';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!selectedChat) return;
        
        const endpoint = isGlobalChat 
            ? '/messages/global' 
            : `/messages/${selectedChat.unique_id}`;

        api.get(endpoint)
            .then(response => setMessages(response.data))
            .catch(error => console.error("Failed to fetch messages:", error));

    }, [selectedChat, isGlobalChat]);

    useEffect(() => {
        if (!socket) return;

        const privateMessageHandler = (message) => {
            if (!isGlobalChat && selectedChat && (message.sender_id === selectedChat.id || message.recipient_id === selectedChat.id)) {
                setMessages(prev => [...prev, message]);
            }
        };

        const globalMessageHandler = (message) => {
            if (isGlobalChat) {
                setMessages(prev => [...prev, message]);
            }
        };

        socket.on('receive_message', privateMessageHandler);
        socket.on('receive_global_message', globalMessageHandler);

        return () => {
            socket.off('receive_message', privateMessageHandler);
            socket.off('receive_global_message', globalMessageHandler);
        };
    }, [socket, selectedChat, isGlobalChat]);

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket && selectedChat) {
            const event = isGlobalChat ? 'send_global_message' : 'send_message';
            const payload = isGlobalChat 
                ? { content: newMessage }
                : { recipient_unique_id: selectedChat.unique_id, content: newMessage };
            
            socket.emit(event, payload);
            setNewMessage('');
        }
    };

    if (!selectedChat || !currentUser) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a friend or Global Chat to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">{selectedChat.username}</h2>
            </div>

            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map(msg => {
                    const isMyMessage = msg.sender_id === currentUser.id || msg.sender?.id === currentUser.id;
                    return (
                        <div 
                            key={msg.id || msg.timestamp} 
                            className={`flex mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                {!isMyMessage && msg.is_global && (
                                    <span className="text-xs text-gray-400 mb-1 ml-2">
                                        <Link to={`/profile/${msg.sender.username}`} className="hover:underline">
                                            {msg.sender.username}
                                        </Link>
                                    </span>
                                )}
                                <div 
                                    className={`p-3 rounded-lg max-w-lg ${
                                        isMyMessage 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-700 text-white'
                                    }`}
                                >
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow p-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-600"
                    />
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
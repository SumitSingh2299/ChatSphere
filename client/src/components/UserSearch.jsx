import React, { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import api from '../services/api';

const UserSearch = ({ onNotification }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async (query) => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/friends/search?username=${query}`);
            setResults(response.data);
        } catch (error) {
            console.error("Failed to search for users:", error);
            onNotification({ type: 'error', message: 'User search failed.' });
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchUsers = useCallback(debounce(fetchUsers, 300), []);

    const handleSearchChange = (e) => {
        // This is the corrected line
        const query = e.target.value;
        setSearchTerm(query);
        debouncedFetchUsers(query);
    };

    const handleSendRequest = async (userId) => {
        try {
            await api.post(`/friends/send_request/${userId}`);
            onNotification({ type: 'success', message: 'Friend request sent!' });
            setResults([]);
            setSearchTerm('');
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Could not send request.';
            onNotification({ type: 'error', message: errorMessage });
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500 border-gray-600"
            />
            {loading && <p className="text-sm p-2">Searching...</p>}
            {results.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-gray-800 border rounded-lg shadow-lg border-gray-600">
                    {results.map(user => (
                        <li key={user.unique_id} className="flex items-center justify-between p-2 hover:bg-gray-700">
                            <span>{user.username}</span>
                            <button
                                onClick={() => handleSendRequest(user.unique_id)}
                                className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                            >
                                Add
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserSearch;
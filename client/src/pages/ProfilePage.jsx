import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api'; // Use the correct relative path

const ProfilePage = () => {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/users/${username}`);
                setProfile(response.data);
            } catch (err) {
                setError('Failed to fetch user profile. The user may not exist.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading profile...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <p className="text-red-500 mb-4">{error}</p>
                <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="container mx-auto">
                <div className="bg-gray-800 shadow-lg rounded-lg p-6">
                    <h1 className="text-3xl font-bold mb-2">{profile?.username}</h1>
                    <p className="text-gray-400">Unique ID: {profile?.unique_id}</p>
                </div>
                <Link to="/dashboard" className="text-blue-500 hover:underline mt-6 inline-block">
                    &larr; Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default ProfilePage;
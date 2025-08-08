import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// When in production, connect to the same host the page is on.
// Otherwise, connect to the local dev server.
const URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

export const useSocket = () => {
    // ... rest of the hook is the same
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(URL, {
            withCredentials: true,
        });
        setSocket(newSocket);
        // ... listeners
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return socket;
};
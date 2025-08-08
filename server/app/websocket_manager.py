# Contains connection managers for handling real-time WebSocket communications.

from fastapi import WebSocket
from typing import Dict, List, Set

class ConnectionManager:
    """
    Manages active WebSocket connections for chat rooms.
    A dictionary holds room IDs as keys and a list of active WebSockets as values.
    """
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        """Accepts and stores a new WebSocket connection for a given room."""
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        print(f"New connection in room: {room_id}. Total: {len(self.active_connections[room_id])}")

    def disconnect(self, room_id: str, websocket: WebSocket):
        """Removes a WebSocket connection from a room."""
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
            print(f"Connection closed in room: {room_id}.")

    async def broadcast(self, room_id: str, message: str):
        """Broadcasts a message to all clients in a specific room."""
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

class NotificationManager:
    """
    Manages active WebSocket connections for user-specific notifications.
    A dictionary holds user IDs as keys and their active WebSocket as the value.
    """
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Accepts and stores a new WebSocket connection for a given user."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"Notification socket connected for user: {user_id}")

    def disconnect(self, user_id: str):
        """Removes a user's WebSocket connection."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"Notification socket disconnected for user: {user_id}")

    async def send_personal_notification(self, user_id: str, message: str):
        """Sends a notification to a specific user if they are connected."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(message)
            print(f"Sent notification to {user_id}: {message}")
        else:
            print(f"User {user_id} not connected for notifications.")
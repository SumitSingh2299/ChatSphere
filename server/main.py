# Main application file to initialize and configure the FastAPI app.

import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Import routers and other modules
from database import init_db
from routers import auth, users, chat
from websocket_manager import ConnectionManager, NotificationManager

# Load environment variables from .env file
load_dotenv()

# --- App Initialization ---
app = FastAPI(
    title="ChatSphere API",
    description="The backend for the real-time ChatSphere application.",
    version="1.0.0"
)

# --- CORS Middleware ---
# Allows the React client (running on a different port) to communicate with the API.
origins = [
    "http://localhost:5173",  # Default Vite dev server port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection ---
@app.on_event("startup")
async def startup_db_client():
    """
    Connect to MongoDB on application startup.
    """
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    app.mongodb_client = AsyncIOMotorClient(mongodb_url)
    app.db = app.mongodb_client["chatsphere"]
    print("Connected to MongoDB...")
    # Initialize database collections and indexes
    await init_db(app.db)
    print("Database initialized.")


@app.on_event("shutdown")
async def shutdown_db_client():
    """
    Close MongoDB connection on application shutdown.
    """
    app.mongodb_client.close()
    print("MongoDB connection closed.")


# --- WebSocket Connection Managers ---
# These managers handle active WebSocket connections.
chat_manager = ConnectionManager()
notification_manager = NotificationManager()

# --- API Routers ---
# Include the REST API endpoints from the routers.
app.include_router(auth.router, tags=["Authentication"], prefix="/api/auth")
app.include_router(users.router, tags=["Users & Friends"], prefix="/api")
app.include_router(chat.router, tags=["Chat Rooms"], prefix="/api/chatrooms")


# --- WebSocket Endpoints ---

@app.websocket("/ws/chat/{room_id}")
async def websocket_chat_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time chat in both global and private rooms.
    """
    # The user ID is passed as a query parameter for identification
    user_id = websocket.query_params.get("user_id")
    if not user_id:
        await websocket.close(code=1008)
        return

    await chat_manager.connect(room_id, websocket)
    try:
        while True:
            # Wait for a message from the client
            data = await websocket.receive_text()
            # Broadcast the message to all clients in the same room
            await chat_manager.broadcast(room_id, data)
    except WebSocketDisconnect:
        chat_manager.disconnect(room_id, websocket)
        print(f"Client {user_id} disconnected from room {room_id}")


@app.websocket("/ws/notifications/{user_id}")
async def websocket_notification_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for sending real-time notifications to a specific user.
    """
    await notification_manager.connect(user_id, websocket)
    try:
        # Keep the connection alive to receive notifications
        while True:
            # This endpoint primarily listens; it doesn't expect incoming messages
            # from the client, but we need a loop to keep it open.
            await websocket.receive_text() # This will block until a message is received or connection is closed.
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id)
        print(f"Notification socket for user {user_id} disconnected.")

# Add a reference to the notification manager to the app state
# so it can be accessed from the REST endpoints to send notifications.
app.state.notification_manager = notification_manager

print("FastAPI app setup complete. Waiting for uvicorn to start...")
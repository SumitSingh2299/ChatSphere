import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-default-secret-key'
    
    # New: MongoDB connection string
    # For local dev, it connects to a local MongoDB instance.
    # For production, you'll set this to your MongoDB Atlas string.
    MONGO_URI = os.environ.get('MONGODB_URI') or "mongodb://localhost:27017/chatsphere"
    
    FLASK_ENV = os.environ.get('FLASK_ENV')
    FRONTEND_URLS = os.environ.get('FRONTEND_URLS', '')
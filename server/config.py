import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-default-secret-key'

    # Change this to MONGO_URI to match the production standard
    MONGO_URI = os.environ.get('MONGO_URI') or "mongodb://localhost:27017/chatsphere"

    FLASK_ENV = os.environ.get('FLASK_ENV')
    FRONTEND_URLS = os.environ.get('FRONTEND_URLS', '')

# server/config.py
import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_key")  
    MONGO_URI = os.getenv("MONGO_URI")
    FRONTEND_URLS = os.getenv("FRONTEND_URLS", "")

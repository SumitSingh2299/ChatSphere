from dotenv import load_dotenv
import os

load_dotenv()  # load variables from .env

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Set MONGO_URI from environment
    app.config["MONGO_URI"] = os.getenv("MONGO_URI")

    # Dynamic CORS config
    frontend_urls = app.config.get('FRONTEND_URLS', '')
    origins = [url.strip() for url in frontend_urls.split(',')] if frontend_urls else []
    CORS(app, origins=origins, supports_credentials=True)

    mongo.init_app(app)
    login.init_app(app)
    socketio.init_app(app, cors_allowed_origins=origins)

    # Register Blueprints
    from app.routes.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from app.routes.friends import bp as friends_bp
    app.register_blueprint(friends_bp, url_prefix='/api/friends')
    
    from app.routes.messages import bp as messages_bp
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    from app.routes.users import bp as users_bp
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    from . import events

    return app, socketio

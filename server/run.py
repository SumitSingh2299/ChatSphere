from app import create_app, mongo # Import 'mongo', not 'db'

# The create_app factory now returns two objects
app, socketio = create_app()

@app.shell_context_processor
def make_shell_context():
    """Makes variables available in the Flask shell context for debugging."""
    # Expose the 'mongo' object instead of the old 'db' and models
    return {'mongo': mongo, 'socketio': socketio}

if __name__ == '__main__':
    # Use socketio.run() to start the server, which enables WebSocket support
    socketio.run(app, debug=True)
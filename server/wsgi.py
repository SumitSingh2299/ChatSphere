from app import create_app


app, socketio = create_app()

if __name__ == "__main__":
    # For local development — use SocketIO’s run method so events work
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)

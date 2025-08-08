# This file acts as the entry point for Vercel's serverless environment.
# It imports and creates the Flask app instance.

from server.app import create_app

# The create_app function now returns two objects, we only need the app for Vercel
app, _ = create_app()

# Vercel will look for a variable named 'app' or 'handler'
# In our case, it's the Flask app instance.
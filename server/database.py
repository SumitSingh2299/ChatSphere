# Handles database connection, collection setup, and index creation.

import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase

async def init_db(db: AsyncIOMotorDatabase):
    """
    Initializes database collections and creates necessary indexes.
    This function is called on application startup.
    """
    # --- User Collection ---
    # Ensure a unique index on 'username' and 'unique_id' for fast lookups and to prevent duplicates.
    await db.users.create_index("username", unique=True)
    await db.users.create_index("unique_id", unique=True)
    print("Users collection indexes checked/created.")

    # --- Messages Collection ---
    # Create a TTL (Time-To-Live) index on 'createdAt' for the global chat room.
    # This automatically deletes messages from the 'global' room after a specified time.
    # We apply this index only to documents where 'room_id' is 'global'.
    try:
        # Check if the TTL index already exists
        index_info = await db.messages.index_information()
        ttl_index_name = "createdAt_1_global_ttl"

        if ttl_index_name not in index_info:
            print("Creating TTL index for global chat messages...")
            await db.messages.create_index(
                [("createdAt", pymongo.ASCENDING)],
                name=ttl_index_name,
                expireAfterSeconds=3600,  # 1 hour
                partialFilterExpression={"room_id": "global"}
            )
            print("TTL index created successfully.")
        else:
            print("TTL index already exists.")

    except Exception as e:
        print(f"An error occurred while creating TTL index: {e}")

    # Create a standard index on room_id for efficient querying of chat histories.
    await db.messages.create_index("room_id")
    print("Messages collection indexes checked/created.")

    # --- Friend Requests Collection ---
    # Index on to_user_id for quickly finding requests for a specific user.
    await db.friend_requests.create_index("to_user_id")
    print("Friend requests collection indexes checked/created.")

    print("Database initialization complete.")
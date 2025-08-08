# API endpoints for creating and managing chat rooms.

from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List
from bson import ObjectId

from models import ChatRoom, ChatRoomCreate, UserInDB
from security import verify_token
from database import AsyncIOMotorDatabase
from .users import get_current_user # Import dependency from sibling router

router = APIRouter()

# --- Dependency to get DB instance ---
def get_database(request: Request) -> AsyncIOMotorDatabase:
    return request.app.db

# --- Endpoints ---

@router.post("/create", response_model=ChatRoom, status_code=status.HTTP_201_CREATED)
async def create_chatroom(
    chatroom_data: ChatRoomCreate,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Creates a new private chatroom. The creator is automatically a member.
    """
    new_chatroom = ChatRoom(
        name=chatroom_data.name,
        created_by=current_user.id,
        members=[current_user.id]
    )
    
    created_room = await db.chatrooms.insert_one(new_chatroom.dict(exclude={"id"}))
    
    # Fetch the created room to return it with the generated ID
    db_room = await db.chatrooms.find_one({"_id": created_room.inserted_id})
    return ChatRoom(**db_room)


@router.post("/{room_id}/invite", status_code=status.HTTP_200_OK)
async def invite_to_chatroom(
    room_id: str,
    user_ids_to_invite: List[str],
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Invites users (from the current user's friends list) to a private chatroom.
    """
    try:
        room_obj_id = ObjectId(room_id)
        user_obj_ids = [ObjectId(uid) for uid in user_ids_to_invite]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Room or User ID format")

    # Verify the chatroom exists and the current user is a member
    chatroom = await db.chatrooms.find_one({"_id": room_obj_id})
    if not chatroom or current_user.id not in chatroom["members"]:
        raise HTTPException(status_code=403, detail="Not authorized to invite users to this room")

    # Verify that the users to be invited are friends with the current user
    for user_id in user_obj_ids:
        if user_id not in current_user.friends:
            raise HTTPException(
                status_code=403, 
                detail=f"User with ID {user_id} is not in your friends list."
            )

    # Add new members to the chatroom
    result = await db.chatrooms.update_one(
        {"_id": room_obj_id},
        {"$addToSet": {"members": {"$each": user_obj_ids}}}
    )

    if result.modified_count == 0:
        return {"message": "Users were already members or no new users were invited."}
        
    return {"message": f"Successfully invited {result.modified_count} new member(s)."}

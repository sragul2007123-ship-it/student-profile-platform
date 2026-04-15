from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from typing import List

router = APIRouter()

@router.get("/{user_id}/{other_user_id}")
async def get_messages(user_id: str, other_user_id: str):
    try:
        # Fetch messages between two users
        res = supabase.table("messages").select("*").or_(
            f"and(sender_id.eq.{user_id},receiver_id.eq.{other_user_id}),and(sender_id.eq.{other_user_id},receiver_id.eq.{user_id})"
        ).order("created_at", desc=False).execute()
        return res.data
    except Exception as e:
        print("Error fetching messages", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@router.post("/")
async def send_message(message: dict):
    try:
        res = supabase.table("messages").insert({
            "sender_id": message["sender_id"],
            "receiver_id": message["receiver_id"],
            "content": message["content"]
        }).execute()
        return res.data[0]
    except Exception as e:
        print("Error sending message", str(e))
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    try:
        # Fetch accepted friendships for the user
        friendships_res = supabase.table("friendships").select("requester_id, addressee_id").or_(
            f"requester_id.eq.{user_id},addressee_id.eq.{user_id}"
        ).eq("status", "accepted").execute()
        
        friend_ids = []
        for f in friendships_res.data:
            if str(f["requester_id"]) == user_id:
                friend_ids.append(f["addressee_id"])
            else:
                friend_ids.append(f["requester_id"])
        
        if not friend_ids:
            return []
            
        # Fetch user details for the friend IDs
        users_res = supabase.table("users").select("id, name, username, profile_photo").in_("id", friend_ids).execute()
        return users_res.data
    except Exception as e:
        print("Error fetching conversations", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")

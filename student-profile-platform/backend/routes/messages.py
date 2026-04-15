from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from typing import List

router = APIRouter()

@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    try:
        # Fetch friendships where user is requester
        res1 = supabase.table("friendships").select("addressee_id").eq("requester_id", user_id).eq("status", "accepted").execute()
        # Fetch friendships where user is addressee
        res2 = supabase.table("friendships").select("requester_id").eq("addressee_id", user_id).eq("status", "accepted").execute()
        
        friend_ids = []
        for f in res1.data:
            friend_ids.append(f["addressee_id"])
        for f in res2.data:
            friend_ids.append(f["requester_id"])
        
        if not friend_ids:
            return []
            
        # Fetch user details for the friend IDs
        users_res = supabase.table("users").select("id, name, username, profile_photo").in_("id", friend_ids).execute()
        return users_res.data
    except Exception as e:
        print(f"Get conversations error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/{other_user_id}")
async def get_messages(user_id: str, other_user_id: str):
    try:
        # Fetch messages where user is sender or receiver (more robust than nested or_)
        res = supabase.table("messages").select("*").or_(
            f"sender_id.eq.{user_id},receiver_id.eq.{user_id}"
        ).execute()
        
        # Filter for messages specifically between these two users
        filtered_messages = [
            m for m in res.data 
            if (str(m["sender_id"]) == user_id and str(m["receiver_id"]) == other_user_id) or
               (str(m["sender_id"]) == other_user_id and str(m["receiver_id"]) == user_id)
        ]
        
        # Sort by creation time ascending
        filtered_messages.sort(key=lambda x: x["created_at"])
        
        return filtered_messages
    except Exception as e:
        print(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def send_message(message: dict):
    try:
        data = {
            "sender_id": message["sender_id"],
            "receiver_id": message["receiver_id"],
            "content": message["content"]
        }
        res = supabase.table("messages").insert(data).execute()
        if not res.data:
            raise Exception("Record not inserted")
        return res.data[0]
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter()

@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    try:
        # Update current user's presence whenever they check messages
        supabase.table("users").update({"last_seen": datetime.now(timezone.utc).isoformat()}).eq("id", user_id).execute()

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
            
        # Fetch user details for the friend IDs including last_seen for presence
        users_res = supabase.table("users").select("id, name, username, profile_photo, last_seen").in_("id", friend_ids).execute()
        return users_res.data
    except Exception as e:
        print(f"Get conversations error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/{other_user_id}")
async def get_messages(user_id: str, other_user_id: str):
    try:
        # Optimized query: Fetch limited latest messages to avoid lag
        res = supabase.table("messages").select("*").or_(
            f"sender_id.eq.{user_id},receiver_id.eq.{user_id}"
        ).order("created_at", desc=True).limit(50).execute()
        
        # Filter for messages specifically between these two users
        filtered_messages = [
            m for m in res.data 
            if (str(m["sender_id"]) == user_id and str(m["receiver_id"]) == other_user_id) or
               (str(m["sender_id"]) == other_user_id and str(m["receiver_id"]) == user_id)
        ]
        
        # Sort back to chronological for the UI
        filtered_messages.sort(key=lambda x: x["created_at"])
        
        return filtered_messages
    except Exception as e:
        print(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def send_message(message: dict):
    try:
        # Support for text and media
        data = {
            "sender_id": message["sender_id"],
            "receiver_id": message["receiver_id"],
            "content": message.get("content"),
            "media_url": message.get("media_url"),
            "media_type": message.get("media_type")
        }
        res = supabase.table("messages").insert(data).execute()
        if not res.data:
            raise Exception("Record not inserted")
        return res.data[0]
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/presence/{user_id}")
async def update_presence(user_id: str):
    try:
        supabase.table("users").update({"last_seen": datetime.now(timezone.utc).isoformat()}).eq("id", user_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{message_id}")
async def delete_message(message_id: int):
    try:
        res = supabase.table("messages").delete().eq("id", message_id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{message_id}/react")
async def react_to_message(message_id: int, reaction_data: dict):
    try:
        emoji = reaction_data.get("emoji")
        user_id = reaction_data.get("user_id")
        
        # Fetch current reactions
        msg_res = supabase.table("messages").select("reactions").eq("id", message_id).single().execute()
        reactions = msg_res.data.get("reactions") if msg_res.data else {}
        if reactions is None: reactions = {}
        
        # Update reactions logic
        if emoji in reactions:
            if user_id in reactions[emoji]:
                reactions[emoji].remove(user_id)
                if not reactions[emoji]:
                    del reactions[emoji]
            else:
                reactions[emoji].append(user_id)
        else:
            reactions[emoji] = [user_id]
            
        supabase.table("messages").update({"reactions": reactions}).eq("id", message_id).execute()
        return {"status": "success", "reactions": reactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


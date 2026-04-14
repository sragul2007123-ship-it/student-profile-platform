from fastapi import APIRouter, HTTPException
from database import supabase
from pydantic import BaseModel

router = APIRouter()


class FriendRequest(BaseModel):
    addressee_id: str


@router.get("/{user_id}")
async def get_friends(user_id: str):
    """Get all accepted friends for a user."""
    try:
        # Get friendships where user is requester or addressee and status is accepted
        res1 = supabase.table("friendships").select(
            "*, addressee:users!friendships_addressee_id_fkey(id, name, username, profile_photo)"
        ).eq("requester_id", user_id).eq("status", "accepted").execute()

        res2 = supabase.table("friendships").select(
            "*, requester:users!friendships_requester_id_fkey(id, name, username, profile_photo)"
        ).eq("addressee_id", user_id).eq("status", "accepted").execute()

        friends = []
        for f in res1.data:
            friend_data = f.get("addressee", {})
            friends.append({
                "friendship_id": f["id"],
                "id": friend_data.get("id"),
                "name": friend_data.get("name"),
                "username": friend_data.get("username"),
                "profile_photo": friend_data.get("profile_photo"),
            })
        for f in res2.data:
            friend_data = f.get("requester", {})
            friends.append({
                "friendship_id": f["id"],
                "id": friend_data.get("id"),
                "name": friend_data.get("name"),
                "username": friend_data.get("username"),
                "profile_photo": friend_data.get("profile_photo"),
            })

        return friends
    except Exception as e:
        print(f"Get friends error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/pending")
async def get_pending_requests(user_id: str):
    """Get pending friend requests received by a user."""
    try:
        res = supabase.table("friendships").select(
            "*, requester:users!friendships_requester_id_fkey(id, name, username, profile_photo)"
        ).eq("addressee_id", user_id).eq("status", "pending").execute()

        requests = []
        for f in res.data:
            requester_data = f.get("requester", {})
            requests.append({
                "friendship_id": f["id"],
                "id": requester_data.get("id"),
                "name": requester_data.get("name"),
                "username": requester_data.get("username"),
                "profile_photo": requester_data.get("profile_photo"),
            })
        return requests
    except Exception as e:
        print(f"Get pending error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/sent")
async def get_sent_requests(user_id: str):
    """Get pending friend requests sent by a user."""
    try:
        res = supabase.table("friendships").select(
            "*, addressee:users!friendships_addressee_id_fkey(id, name, username, profile_photo)"
        ).eq("requester_id", user_id).eq("status", "pending").execute()

        sent = []
        for f in res.data:
            addressee_data = f.get("addressee", {})
            sent.append({
                "friendship_id": f["id"],
                "id": addressee_data.get("id"),
                "name": addressee_data.get("name"),
                "username": addressee_data.get("username"),
                "profile_photo": addressee_data.get("profile_photo"),
            })
        return sent
    except Exception as e:
        print(f"Get sent error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/send")
async def send_friend_request(user_id: str, req: FriendRequest):
    """Send a friend request."""
    try:
        if user_id == req.addressee_id:
            raise HTTPException(status_code=400, detail="Cannot friend yourself")

        # Check if friendship already exists (in either direction)
        existing1 = supabase.table("friendships").select("id, status").eq(
            "requester_id", user_id
        ).eq("addressee_id", req.addressee_id).execute()

        existing2 = supabase.table("friendships").select("id, status").eq(
            "requester_id", req.addressee_id
        ).eq("addressee_id", user_id).execute()

        if existing1.data:
            status = existing1.data[0]["status"]
            if status == "accepted":
                raise HTTPException(status_code=400, detail="Already friends")
            if status == "pending":
                raise HTTPException(status_code=400, detail="Request already sent")
            # If rejected, allow re-sending by updating
            supabase.table("friendships").update(
                {"status": "pending"}
            ).eq("id", existing1.data[0]["id"]).execute()
            return {"message": "Friend request re-sent"}

        if existing2.data:
            status = existing2.data[0]["status"]
            if status == "accepted":
                raise HTTPException(status_code=400, detail="Already friends")
            if status == "pending":
                # Auto-accept if both sent requests to each other
                supabase.table("friendships").update(
                    {"status": "accepted"}
                ).eq("id", existing2.data[0]["id"]).execute()
                return {"message": "Friend request accepted (mutual)"}

        # Create new friendship
        res = supabase.table("friendships").insert({
            "requester_id": user_id,
            "addressee_id": req.addressee_id,
            "status": "pending"
        }).execute()

        return {"message": "Friend request sent", "data": res.data[0] if res.data else None}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Send friend request error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{friendship_id}/accept")
async def accept_friend_request(friendship_id: str):
    """Accept a friend request."""
    try:
        res = supabase.table("friendships").update(
            {"status": "accepted"}
        ).eq("id", friendship_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Request not found")

        return {"message": "Friend request accepted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{friendship_id}/reject")
async def reject_friend_request(friendship_id: str):
    """Reject a friend request."""
    try:
        res = supabase.table("friendships").update(
            {"status": "rejected"}
        ).eq("id", friendship_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Request not found")

        return {"message": "Friend request rejected"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{friendship_id}")
async def remove_friend(friendship_id: str):
    """Remove a friend (unfriend)."""
    try:
        supabase.table("friendships").delete().eq("id", friendship_id).execute()
        return {"message": "Friend removed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{user_id}/search")
async def search_users(user_id: str, q: str = ""):
    """Search users to add as friends."""
    try:
        if not q or len(q) < 2:
            return []

        # Search by name or username
        res = supabase.table("users").select("id, name, username, profile_photo").or_(
            f"name.ilike.%{q}%,username.ilike.%{q}%"
        ).neq("id", user_id).limit(10).execute()

        return res.data
    except Exception as e:
        print(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

@router.get("/")
async def get_leaderboard():
    try:
        # Get users with profiles and associated records in a single query
        # This significantly improves performance by avoiding N+1 queries
        res = supabase.table("users").select(
            "*, profiles!inner(*), skills(id), projects(id), certificates(id)"
        ).execute()
        
        users = res.data
        enriched = []
        
        for user in users:
            # Counts are derived from the length of the associated lists
            skill_count = len(user.get("skills", []))
            project_count = len(user.get("projects", []))
            cert_count = len(user.get("certificates", []))
            
            # Weighted scoring system
            score = (skill_count * 2) + (project_count * 5) + (cert_count * 3)
            
            enriched.append({
                "id": user["id"],
                "name": user.get("name"),
                "username": user.get("username"),
                "profile_photo": user.get("profile_photo"),
                "role": user["profiles"].get("role", ""),
                "skillCount": skill_count,
                "projectCount": project_count,
                "certCount": cert_count,
                "score": score,
                "view_count": user["profiles"].get("view_count", 0)
            })
            
        # Sort by score descending
        enriched.sort(key=lambda x: x["score"], reverse=True)
        return enriched
    except Exception as e:
        print(f"Leaderboard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch leaderboard")


@router.get("/friends/{user_id}")
async def get_friends_leaderboard(user_id: str):
    """Get leaderboard filtered to only show friends of the given user."""
    try:
        # Get accepted friend IDs
        res1 = supabase.table("friendships").select("addressee_id").eq(
            "requester_id", user_id
        ).eq("status", "accepted").execute()

        res2 = supabase.table("friendships").select("requester_id").eq(
            "addressee_id", user_id
        ).eq("status", "accepted").execute()

        friend_ids = set()
        friend_ids.add(user_id)  # Include self in friends leaderboard
        for f in res1.data:
            friend_ids.add(f["addressee_id"])
        for f in res2.data:
            friend_ids.add(f["requester_id"])

        if not friend_ids:
            friend_ids = {user_id}

        # Get all users with profiles
        res = supabase.table("users").select(
            "*, profiles!inner(*), skills(id), projects(id), certificates(id)"
        ).in_("id", list(friend_ids)).execute()

        users = res.data
        enriched = []

        for user in users:
            skill_count = len(user.get("skills", []))
            project_count = len(user.get("projects", []))
            cert_count = len(user.get("certificates", []))
            score = (skill_count * 2) + (project_count * 5) + (cert_count * 3)

            enriched.append({
                "id": user["id"],
                "name": user.get("name"),
                "username": user.get("username"),
                "profile_photo": user.get("profile_photo"),
                "role": user["profiles"].get("role", ""),
                "skillCount": skill_count,
                "projectCount": project_count,
                "certCount": cert_count,
                "score": score,
                "view_count": user["profiles"].get("view_count", 0)
            })

        enriched.sort(key=lambda x: x["score"], reverse=True)
        return enriched
    except Exception as e:
        print(f"Friends leaderboard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch friends leaderboard")


@router.get("/friends/{user_id}/activity")
async def get_friends_activity(user_id: str):
    """Get recent projects and certificates from friends."""
    try:
        # Get friend IDs
        res1 = supabase.table("friendships").select("addressee_id").eq(
            "requester_id", user_id
        ).eq("status", "accepted").execute()

        res2 = supabase.table("friendships").select("requester_id").eq(
            "addressee_id", user_id
        ).eq("status", "accepted").execute()

        friend_ids = []
        for f in res1.data: friend_ids.append(f["addressee_id"])
        for f in res2.data: friend_ids.append(f["requester_id"])

        if not friend_ids:
            return []

        # Get latest projects from friends
        projects_res = supabase.table("projects").select(
            "*, users(name, username, profile_photo)"
        ).in_("user_id", friend_ids).order("created_at", desc=True).limit(5).execute()
        
        # Get latest certificates from friends
        certs_res = supabase.table("certificates").select(
            "*, users(name, username, profile_photo)"
        ).in_("user_id", friend_ids).order("created_at", desc=True).limit(5).execute()

        activities = []
        for p in projects_res.data:
            activities.append({
                "type": "project",
                "id": p["id"],
                "title": p.get("title"),
                "user": p.get("users"),
                "created_at": p.get("created_at")
            })
        for c in certs_res.data:
            activities.append({
                "type": "certificate",
                "id": c["id"],
                "title": c.get("title"),
                "user": c.get("users"),
                "created_at": c.get("created_at")
            })

        activities.sort(key=lambda x: x["created_at"], reverse=True)
        return activities[:8]
    except Exception as e:
        print(f"Friends activity error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch friends activity")

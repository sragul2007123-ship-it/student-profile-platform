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

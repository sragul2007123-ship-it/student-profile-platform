from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import supabase

router = APIRouter()

@router.get("/")
async def get_all_recruiters(skip: int = 0, limit: int = 20):
    """Get list of all recruiters with pagination"""
    try:
        res = supabase.table("users").select(
            "*, profiles(*)"
        ).eq("user_type", "recruiter").range(skip, skip + limit - 1).execute()
        
        if not res.data:
            return {"recruiters": []}
        
        recruiters = []
        for user_data in res.data:
            recruiter = {
                "user": {
                    "id": user_data.get("id"),
                    "name": user_data.get("name"),
                    "username": user_data.get("username"),
                    "profile_photo": user_data.get("profile_photo"),
                    "email": user_data.get("email"),
                    "user_type": user_data.get("user_type")
                },
                "profile": user_data.get("profiles")[0] if user_data.get("profiles") else {}
            }
            recruiters.append(recruiter)
        
        return {"recruiters": recruiters, "skip": skip, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{username}")
async def get_recruiter_profile(username: str):
    """Get detailed recruiter profile"""
    try:
        res = supabase.table("users").select(
            "*, profiles(*)"
        ).eq("username", username).eq("user_type", "recruiter").single().execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Recruiter not found")
        
        user_data = res.data
        return {
            "user": {
                "id": user_data.get("id"),
                "name": user_data.get("name"),
                "username": user_data.get("username"),
                "profile_photo": user_data.get("profile_photo"),
                "email": user_data.get("email"),
                "user_type": user_data.get("user_type")
            },
            "profile": user_data.get("profiles")[0] if user_data.get("profiles") else {}
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="Recruiter not found")

@router.get("/search/{query}")
async def search_recruiters(query: str, skip: int = 0, limit: int = 10):
    """Search recruiters by name, username, or company"""
    try:
        # Search in users table
        res = supabase.table("users").select(
            "*, profiles(*)"
        ).eq("user_type", "recruiter").or_(
            f"name.ilike.%{query}%,username.ilike.%{query}%"
        ).range(skip, skip + limit - 1).execute()
        
        if not res.data:
            return {"recruiters": []}
        
        recruiters = []
        for user_data in res.data:
            recruiter = {
                "user": {
                    "id": user_data.get("id"),
                    "name": user_data.get("name"),
                    "username": user_data.get("username"),
                    "profile_photo": user_data.get("profile_photo"),
                    "email": user_data.get("email"),
                    "user_type": user_data.get("user_type")
                },
                "profile": user_data.get("profiles")[0] if user_data.get("profiles") else {}
            }
            recruiters.append(recruiter)
        
        return {"recruiters": recruiters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

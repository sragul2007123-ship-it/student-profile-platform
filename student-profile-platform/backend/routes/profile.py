from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from database import supabase
from models.schemas import ProfileBase, ProfileUpdate, UserBase
import uuid

router = APIRouter()

@router.get("/{user_id}")
async def get_profile(user_id: str):
    try:
        # Try to get user
        try:
            user_res = supabase.table("users").select("*").eq("id", user_id).single().execute()
            user_data = user_res.data
        except Exception:
            # If user record is missing, create it now (Zero-Trigger Fallback)
            # Fetch email from Supabase Auth as a last resort
            auth_user = supabase.auth.admin.get_user_by_id(user_id)
            user_data = {
                "id": user_id,
                "email": auth_user.user.email if auth_user and auth_user.user else "",
                "name": "New Student",
                "created_at": "now()"
            }
            supabase.table("users").insert(user_data).execute()
        
        # Get profile
        try:
            profile_res = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
            profile_data = profile_res.data
        except Exception:
            # If profile doesn't exist, create it
            profile_data = {
                "user_id": user_id,
                "role": "",
                "about": "",
                "education": {},
                "github": "",
                "linkedin": "",
                "view_count": 0
            }
            supabase.table("profiles").insert(profile_data).execute()
        
        return {
            "user": user_data,
            "profile": profile_data
        }
    except Exception as e:
        print(f"Get profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/username/{username}")
async def get_public_profile(username: str):
    try:
        # Fetch everything in a single query using relations
        res = supabase.table("users").select(
            "*, profiles(*), skills(*), projects(*), certificates(*)"
        ).eq("username", username).single().execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        data = res.data
        return {
            "user": {
                "id": data.get("id"),
                "name": data.get("name"),
                "username": data.get("username"),
                "profile_photo": data.get("profile_photo"),
                "email": data.get("email")
            },
            "profile": data.get("profiles"),
            "skills": data.get("skills", []),
            "projects": data.get("projects", []),
            "certificates": data.get("certificates", [])
        }
    except Exception as e:
        print(f"Public profile error: {str(e)}")
        raise HTTPException(status_code=404, detail="Profile not found")

@router.put("/{user_id}")
async def update_profile(user_id: str, data: ProfileUpdate):
    try:
        update_data = data.dict(exclude_unset=True)
        
        # Split data between users table and profiles table
        user_fields = ["name", "username", "profile_photo"]
        user_update = {k: v for k, v in update_data.items() if k in user_fields}
        profile_update = {k: v for k, v in update_data.items() if k not in user_fields}
        
        if user_update:
            supabase.table("users").update(user_update).eq("id", user_id).execute()
        
        if profile_update:
            # Handle nested education if present
            if "education" in profile_update and profile_update["education"]:
                if hasattr(profile_update["education"], "dict"):
                    profile_update["education"] = profile_update["education"].dict()
            
            # Use upsert to handle case where profile record doesn't exist yet
            profile_update["user_id"] = user_id
            supabase.table("profiles").upsert(profile_update).execute()
            
        return {"message": "Profile updated successfully"}
    except Exception as e:
        print(f"Update error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{username}/views")
async def increment_views(username: str):
    try:
        # Use RPC for atomic increment (Best practice)
        res = supabase.rpc("increment_view_count", {"profile_username": username}).execute()
        return {"view_count": res.data}
    except Exception as e:
        # Fallback to manual update if RPC fails
        try:
            # Atomic-ish increment using fetch and update
            profile_res = supabase.table("users").select("id, profiles(view_count)").eq("username", username).single().execute()
            if not profile_res.data:
                raise Exception("User not found")
                
            user_id = profile_res.data["id"]
            current_count = profile_res.data["profiles"]["view_count"] or 0
            
            update_res = supabase.table("profiles").update({"view_count": current_count + 1}).eq("user_id", user_id).execute()
            return {"view_count": current_count + 1}
        except Exception as inner_e:
             raise HTTPException(status_code=500, detail=f"Failed to increment views: {str(inner_e)}")

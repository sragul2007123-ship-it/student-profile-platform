from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

@router.get("/")
async def get_all_posts():
    try:
        res = supabase.table("posts").select(
            "*, users(id, name, username, profile_photo)"
        ).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print("Error fetching posts", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch posts")

@router.post("/")
async def create_post(post: dict):
    try:
        res = supabase.table("posts").insert({
            "user_id": post["user_id"],
            "content": post["content"],
            "image_url": post.get("image_url", "")
        }).execute()
        return res.data[0]
    except Exception as e:
        print("Error creating post", str(e))
        raise HTTPException(status_code=500, detail="Failed to create post")


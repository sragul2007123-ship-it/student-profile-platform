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

@router.post("/{post_id}/like")
async def like_post(post_id: int, data: dict):
    try:
        user_id = data.get("user_id")
        # Check if already liked
        existing = supabase.table("post_likes").select("*").eq("post_id", post_id).eq("user_id", user_id).execute()
        
        if existing.data:
            # Unlike
            supabase.table("post_likes").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
            status = "unliked"
        else:
            # Like
            supabase.table("post_likes").insert({"post_id": post_id, "user_id": user_id}).execute()
            status = "liked"
            
        # Get new count
        likes = supabase.table("post_likes").select("*", count="exact").eq("post_id", post_id).execute()
        return {"status": status, "count": likes.count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{post_id}/comments")
async def get_comments(post_id: int):
    try:
        res = supabase.table("post_comments").select(
            "*, users(id, name, username, profile_photo)"
        ).eq("post_id", post_id).order("created_at").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{post_id}/comments")
async def add_comment(post_id: int, comment: dict):
    try:
        res = supabase.table("post_comments").insert({
            "post_id": post_id,
            "user_id": comment["user_id"],
            "content": comment["content"]
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



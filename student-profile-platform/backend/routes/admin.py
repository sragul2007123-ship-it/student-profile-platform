from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

@router.get("/students")
async def get_all_students():
    try:
        # Fetch users with their profiles and associated counts in one go
        # We select the full profile and just the IDs of projects/skills/certificates for counting
        res = supabase.table("users").select(
            "*, profiles(*), projects(id), skills(id), certificates(id)"
        ).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Admin fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch student data")

@router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    try:
        # Try deleting via admin API (requires service_role key)
        # This is the preferred way as it cleans up auth.users
        try:
            supabase.auth.admin.delete_user(student_id)
            return {"message": "Success: Student deleted from auth and database"}
        except Exception as admin_e:
            print(f"Auth admin delete failed (likely missing service_role): {str(admin_e)}")
            # Fallback to direct table delete
            # Since our schema has ON DELETE CASCADE from users(id) to auth.users(id) - wait
            # Actually cascade usually goes from auth.users -> public.users.
            # Deleting from public.users won't delete from auth.users.
            res = supabase.table("users").delete().eq("id", student_id).execute()
            if not res.data:
                raise Exception("User record not found or already deleted")
            return {"message": "Success: Student record removed from database"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

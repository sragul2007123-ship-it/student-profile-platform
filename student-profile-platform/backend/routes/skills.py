from fastapi import APIRouter, HTTPException
from typing import List
from database import supabase
from models.schemas import SkillCreate

router = APIRouter()

@router.get("/{user_id}")
async def get_skills(user_id: str):
    try:
        res = supabase.table("skills").select("*").eq("user_id", user_id).order("created_at", ascending=False).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}")
async def add_skill(user_id: str, skill: SkillCreate):
    try:
        data = skill.dict()
        data["user_id"] = user_id
        res = supabase.table("skills").insert(data).execute()
        if not res.data:
            raise Exception("Failed to insert skill - possibly permission denied")
        return res.data[0]
    except Exception as e:
        print(f"Skill add error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{skill_id}")
async def update_skill(skill_id: str, skill: SkillCreate):
    try:
        data = skill.dict()
        res = supabase.table("skills").update(data).eq("id", skill_id).execute()
        if not res.data:
            raise Exception("Skill not found or no changes made")
        return res.data[0]
    except Exception as e:
        print(f"Skill update error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{skill_id}")
async def delete_skill(skill_id: str):
    try:
        supabase.table("skills").delete().eq("id", skill_id).execute()
        return {"message": "Skill deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

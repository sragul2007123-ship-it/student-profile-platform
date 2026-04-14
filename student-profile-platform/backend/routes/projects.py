from fastapi import APIRouter, HTTPException
from typing import List
from database import supabase
from models.schemas import ProjectCreate

router = APIRouter()

@router.get("/{user_id}")
async def get_projects(user_id: str):
    try:
        res = supabase.table("projects").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}")
async def add_project(user_id: str, project: ProjectCreate):
    try:
        data = project.dict()
        data["user_id"] = user_id
        res = supabase.table("projects").insert(data).execute()
        if not res.data:
            raise Exception("Failed to insert project")
        return res.data[0]
    except Exception as e:
        print(f"Project add error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{project_id}")
async def update_project(project_id: str, project: ProjectCreate):
    try:
        data = project.dict()
        res = supabase.table("projects").update(data).eq("id", project_id).execute()
        if not res.data:
            raise Exception("Project not found or no changes made")
        return res.data[0]
    except Exception as e:
        print(f"Project update error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{project_id}")
async def delete_project(project_id: str):
    try:
        supabase.table("projects").delete().eq("id", project_id).execute()
        return {"message": "Project deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

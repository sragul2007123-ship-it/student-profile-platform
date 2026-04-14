from fastapi import APIRouter, HTTPException
from typing import List
from database import supabase
from models.schemas import CertificateCreate

router = APIRouter()

@router.get("/{user_id}")
async def get_certificates(user_id: str):
    try:
        res = supabase.table("certificates").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}")
async def add_certificate(user_id: str, certificate: CertificateCreate):
    try:
        data = certificate.dict()
        data["user_id"] = user_id
        res = supabase.table("certificates").insert(data).execute()
        if not res.data:
            raise Exception("Failed to insert certificate")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{certificate_id}")
async def delete_certificate(certificate_id: str):
    try:
        supabase.table("certificates").delete().eq("id", certificate_id).execute()
        return {"message": "Certificate deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

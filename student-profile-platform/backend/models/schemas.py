from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Education(BaseModel):
    college: Optional[str] = ""
    degree: Optional[str] = ""
    year: Optional[str] = ""


class UserBase(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    username: Optional[str] = ""
    profile_photo: Optional[str] = ""


class UserCreate(UserBase):
    id: str


class ProfileBase(BaseModel):
    role: Optional[str] = ""
    about: Optional[str] = ""
    education: Optional[Education] = Education()
    github: Optional[str] = ""
    linkedin: Optional[str] = ""


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    profile_photo: Optional[str] = None
    role: Optional[str] = None
    about: Optional[str] = None
    education: Optional[Education] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None


class SkillBase(BaseModel):
    skill_name: str
    category: Optional[str] = "Other"
    skill_level: int = 50


class SkillCreate(SkillBase):
    pass


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = ""
    github_link: Optional[str] = ""
    demo_link: Optional[str] = ""
    image_url: Optional[str] = ""


class ProjectCreate(ProjectBase):
    pass


class CertificateBase(BaseModel):
    title: str
    certificate_url: Optional[str] = ""


class CertificateCreate(CertificateBase):
    pass

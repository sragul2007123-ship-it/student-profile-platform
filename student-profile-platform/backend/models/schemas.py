from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Education(BaseModel):
    college: Optional[str] = ""
    degree: Optional[str] = ""
    year: Optional[str] = ""


class BadgeOption(BaseModel):
    id: str
    name: str
    icon: str
    color: str
    description: Optional[str] = ""


class UserBase(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    username: Optional[str] = ""
    profile_photo: Optional[str] = ""
    user_type: Optional[str] = "student"  # student or recruiter


class UserCreate(UserBase):
    id: str


class ProfileBase(BaseModel):
    role: Optional[str] = ""
    about: Optional[str] = ""
    education: Optional[Education] = Education()
    github: Optional[str] = ""
    linkedin: Optional[str] = ""
    user_type: Optional[str] = "student"
    leaderboard_rank: Optional[int] = None
    badge_tier: Optional[str] = None  # bronze, silver, gold, platinum
    selected_badge: Optional[str] = None  # which badge to display
    badge_visibility: Optional[bool] = True
    company: Optional[str] = ""  # For recruiters
    company_logo: Optional[str] = ""  # For recruiters
    # Profile customization fields
    banner_image: Optional[str] = ""
    theme_color: Optional[str] = "primary"
    layout_style: Optional[str] = "default"
    gallery_images: Optional[List[str]] = []
    custom_css: Optional[str] = ""
    profile_layout: Optional[dict] = {"sections": ["about", "skills", "projects", "certificates"]}


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    profile_photo: Optional[str] = None
    role: Optional[str] = None
    about: Optional[str] = None
    education: Optional[Education] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    user_type: Optional[str] = None
    selected_badge: Optional[str] = None
    badge_visibility: Optional[bool] = None
    company: Optional[str] = None
    company_logo: Optional[str] = None
    # Profile customization fields
    banner_image: Optional[str] = None
    theme_color: Optional[str] = None
    layout_style: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    custom_css: Optional[str] = None
    profile_layout: Optional[dict] = None


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

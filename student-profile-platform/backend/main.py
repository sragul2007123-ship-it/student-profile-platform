import os
import sys
import logging
from dotenv import load_dotenv

# Ensure the backend directory is in the python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import profile, skills, projects, certificates, leaderboard, admin, friends, recruiters, posts, messages, learning

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Student Profile Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(skills.router, prefix="/api/skills", tags=["Skills"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(friends.router, prefix="/api/friends", tags=["Friends"])
app.include_router(recruiters.router, prefix="/api/recruiters", tags=["Recruiters"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])

@app.on_event("startup")
async def startup_event():
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        logger.warning("SUPABASE_URL or SUPABASE_KEY not found in environment variables! Please check your .env file.")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Student Profile Platform API",
        "status": "online",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # Use 127.0.0.1 specifically for local development
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

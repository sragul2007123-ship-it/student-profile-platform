import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "placeholder-key")

if SUPABASE_URL == "https://placeholder.supabase.co" or SUPABASE_KEY == "placeholder-key":
    print("WARNING: Using placeholder Supabase credentials in backend! Check your environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

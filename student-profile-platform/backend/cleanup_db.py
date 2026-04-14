import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase = create_client(url, key)

def clear_tables():
    print("Starting Database Cleanup...")
    
    tables = [
        "friendships",
        "projects",
        "skills",
        "certificates",
        "profiles",
        "users"
    ]
    
    for table in tables:
        try:
            print(f"Clearing {table}...")
            # Use filters to delete all rows
            supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            print(f"Done: {table} cleared!")
        except Exception as e:
            print(f"Could not clear {table}: {e}")

    print("\nDatabase is now CLEAN! All test data removed.")

if __name__ == "__main__":
    clear_tables()

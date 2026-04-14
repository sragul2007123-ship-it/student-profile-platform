import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('c:/Users/sragu/OneDrive/Documents/python/student-profile-platform/backend/.env')


URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(URL, KEY)

def test_persistence():
    print("--- Database Integrity Test ---")
    
    # 1. Look for users
    users = supabase.table("users").select("*").limit(5).execute()
    if not users.data:
        print("❌ No users found in public.users table.")
        return
    
    test_user = users.data[0]
    user_id = test_user['id']
    print(f"Found user: {test_user.get('name')} ({user_id})")
    
    # 2. Try an update
    print(f"Testing update for {user_id}...")
    test_name = "Persistence Test User"
    res = supabase.table("users").update({"name": test_name}).eq("id", user_id).execute()
    
    if res.data:
        print(f"✅ Update successful in database.")
        
        # 3. Verify it's still there after a fresh fetch
        check = supabase.table("users").select("name").eq("id", user_id).single().execute()
        if check.data and check.data['name'] == test_name:
            print(f"✅ Data persistence verified.")
        else:
            print(f"❌ DATA LOST: Fetch returned {check.data}")
    else:
        print(f"❌ Update failed. Check RLS or permissions.")

if __name__ == "__main__":
    test_persistence()

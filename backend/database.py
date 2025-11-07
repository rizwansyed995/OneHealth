from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# --- Define all collections used across routes ---
users_collection = db["users"]
patients_collection = db["patients"]
reports_collection = db["reports"]  # ✅ Add this line
appointments_collection = db["appointments"]  # optional, if you use it later

print("✅ Connected to MongoDB Atlas successfully!")

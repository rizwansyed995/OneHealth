from fastapi import APIRouter, HTTPException, Depends
from models import User
from database import users_collection, patients_collection
from auth import hash_password, verify_password, create_access_token, get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])


# === Register User ===
@router.post("/register")
async def register_user(user: User):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = hash_password(user.password)
    generated_patient_id = user.patientId or None

    # Auto-generate patient record if role is 'patient'
    if user.role == "patient":
        generated_patient_id = generated_patient_id or str(uuid.uuid4())
        stub_patient = {
            "patientId": generated_patient_id,
            "createdAt": datetime.utcnow(),
            "name": None,
            "age": None,
            "gender": None,
        }
        await patients_collection.insert_one(stub_patient)

    user_data = {
        "email": user.email,
        "password": hashed_pwd,
        "role": user.role,
        "patientId": generated_patient_id,
        "createdAt": datetime.utcnow(),
    }

    await users_collection.insert_one(user_data)
    return {"message": "User registered successfully"}


# === Login User ===
@router.post("/login")
async def login_user(user: User):
    existing_user = await users_collection.find_one({"email": user.email})
    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    valid = verify_password(user.password, existing_user["password"])
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Login successful",
    }


# === Protected Route (for testing JWT) ===
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    from database import patients_collection  # local import to avoid circular imports

    user_info = {
        "email": current_user["email"],
        "role": current_user["role"],
        "patientId": current_user.get("patientId"),
    }

    # ✅ If user is a patient, fetch their name
    if current_user.get("role") == "patient" and current_user.get("patientId"):
        patient = await patients_collection.find_one(
            {"patientId": current_user["patientId"]},
            {"name": 1, "_id": 0}
        )
        if patient and patient.get("name"):
            user_info["name"] = patient["name"]
        else:
            user_info["name"] = None  # fallback if not set yet

    return user_info

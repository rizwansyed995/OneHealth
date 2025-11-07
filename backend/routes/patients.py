from fastapi import APIRouter, HTTPException, Depends
from models import Patient
from database import patients_collection
from auth import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.put("/me")
async def update_patient_details(patient_update: Patient, current_user: dict = Depends(get_current_user)):
    # 1. Ensure user is a patient
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can update their own details")

    # 2. Get the patientId from their token
    patient_id = current_user.get("patientId")
    if not patient_id:
        raise HTTPException(status_code=400, detail="User has no associated patient ID")

    # 3. Create update data, excluding unset fields and the patientId
    update_data = patient_update.model_dump(exclude_unset=True)
    if "patientId" in update_data:
        del update_data["patientId"] # Don't allow changing the ID

    # 4. Update the "stub" record in the database
    result = await patients_collection.update_one(
        {"patientId": patient_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient record not found")

    return {"message": "Patient details updated successfully"}


@router.get("/{patientId}")
async def get_patient(patientId: str, current_user: dict = Depends(get_current_user)):
    # ✅ Only allow if:
    # - The current user is the same patient
    # - OR a doctor approved by this patient
    if current_user["role"] == "patient" and current_user.get("patientId") != patientId:
        raise HTTPException(status_code=403, detail="Access denied")

    if current_user["role"] == "doctor" and patientId not in current_user.get("approved_patients", []):
        raise HTTPException(status_code=403, detail="Doctor not approved by this patient")

    patient = await patients_collection.find_one({"patientId": patientId})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient["_id"] = str(patient["_id"])
    return patient


@router.get("/get-user-data")
async def get_user_data(current_user: dict = Depends(get_current_user)):
    # Only patients can access this
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access their data")

    patient_id = current_user.get("patientId")
    if not patient_id:
        raise HTTPException(status_code=400, detail="No patientId found in token")

    patient = await patients_collection.find_one({"patientId": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient["_id"] = str(patient["_id"])
    return patient

from fastapi import APIRouter, HTTPException, Depends
from models import Report
from database import reports_collection, users_collection
from auth import get_current_user
import uuid

router = APIRouter(prefix="/reports", tags=["Reports"])

# --- Add Report ---
@router.post("/")
async def add_report(report: Report, current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role")

    if user_role == "patient":
        if report.patientId != current_user.get("patientId"):
            raise HTTPException(status_code=403, detail="Patients can only add reports for themselves")
    elif user_role == "doctor":
        if report.patientId not in current_user.get("approved_patients", []):
            raise HTTPException(status_code=403, detail="Doctor not approved by this patient")
    else:
        raise HTTPException(status_code=403, detail="You do not have permission to add a report")

    report_data = report.model_dump()
    report_data["reportId"] = str(uuid.uuid4())

    await reports_collection.insert_one(report_data)
    # Return the new ID so the client knows what it is
    return {"message": "Report added successfully", "reportId": report_data["reportId"]}

# --- Get Reports by Patient ---
@router.get("/{patientId}")
async def get_reports_by_patient(patientId: str, current_user: dict = Depends(get_current_user)):

    if current_user["role"] == "doctor" and patientId not in current_user.get("approved_patients", []):
        raise HTTPException(status_code=403, detail="Doctor not approved by this patient")

    if current_user["role"] == "patient" and current_user.get("patientId") != patientId:
        raise HTTPException(status_code=403, detail="Access denied")

    reports = []
    async for report in reports_collection.find({"patientId": patientId}):
        report["_id"] = str(report["_id"])
        reports.append(report)

    if not reports:
        raise HTTPException(status_code=404, detail="No reports found for this patient")

    return reports



from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime

# ---- Patient Model ----
class Patient(BaseModel):
    patientId: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact: Optional[Dict[str, str]] = None
    address: Optional[Dict[str, str]] = None
    bloodGroup: Optional[str] = None
    createdAt: Optional[datetime] = datetime.utcnow()

# ---- Report Model ----
class Report(BaseModel):
    reportId: Optional[str] = None
    patientId: str
    type: str
    doctor: Optional[str] = None
    date: Optional[datetime] = datetime.utcnow()
    results: Optional[Dict[str, str]] = None
    reportFile: Optional[str] = None
    notes: Optional[str] = None
    createdAt: Optional[datetime] = datetime.utcnow()

# ---- Auth Model ----
class User(BaseModel):
    email: EmailStr
    password: str
    role: str = "patient"  # can be "patient" or "doctor"
    patientId: str | None = None  # only for patients
    approved_patients: list[str] = []  # only for doctors

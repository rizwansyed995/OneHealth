import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import patients, reports, auth_routes, ai_routes
from routes import upload_routes
from api import google_fit_routes
app = FastAPI(title="OneHealth Unified API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # update to frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(upload_routes.router)
app.include_router(auth_routes.router)
app.include_router(patients.router)
app.include_router(reports.router)
app.include_router(ai_routes.router)


app.include_router(google_fit_routes.router, prefix="/fit", tags=["Google Fit"])


@app.get("/")
def home():
    return {"message": "Welcome to OneHealth Unified API"}

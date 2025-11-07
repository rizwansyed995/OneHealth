import os
from fastapi import APIRouter, UploadFile, File
from utils.pdf_parser import extract_text_from_pdf
from utils.health_extract import extract_health_data, calculate_risk
from utils.ai_suggestions import get_gemini_suggestion
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

router = APIRouter(prefix="/ai", tags=["AI Insights"])

@router.post("/analyze-report/")
async def analyze_report(file: UploadFile = File(...)):
    """Analyze a health report PDF and return AI-based insights."""
    try:
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        text = extract_text_from_pdf(file_path)
        data = extract_health_data(text)
        risk = calculate_risk(data)
        suggestion = get_gemini_suggestion(data)

        os.remove(file_path)

        return {
            "status": "success",
            "data": data,
            "risk": risk,
            "suggestion": suggestion
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

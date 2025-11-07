import google.generativeai as genai

def get_gemini_suggestion(data):
    """Ask Gemini for a short 2–3 line suggestion."""
    model = genai.GenerativeModel("gemini-2.0-flash")
    prompt = f"""
    You are a healthcare assistant. Based on the following patient's data,
    give a short health insight (max 3 lines).

    Data:
    Age: {data['age']}
    BMI: {data['bmi']}
    Blood Pressure: {data['systolic_bp']}/{data['diastolic_bp']}
    Glucose: {data['glucose']}
    Cholesterol: {data['cholesterol']}
    Smoking: {data['smoking']}
    Active: {data['physical_activity']}
    Family History: {data['family_history']}
    """
    response = model.generate_content(prompt)
    return response.text.strip()

import re

def extract_health_data(text):
    def find(pattern, default="N/A"):
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1) if match else default

    age = find(r"Age[:\s]+(\d+)")
    bmi = find(r"BMI[:\s]+([\d.]+)")
    systolic_bp = find(r"Blood Pressure[:\s]+(\d+)")
    diastolic_bp = find(r"/(\d+)")
    glucose = find(r"Glucose[:\s]+([\d.]+)")
    cholesterol = find(r"Cholesterol[:\s]+([\d.]+)")
    sex = 1 if "Male" in text else 0
    smoking = "yes" if re.search(r"smok(ing|er)", text, re.IGNORECASE) else "no"
    physical_activity = "yes" if re.search(r"(exercise|active)", text, re.IGNORECASE) else "no"
    family_history = "yes" if re.search(r"family history", text, re.IGNORECASE) else "no"

    return {
        "age": age,
        "bmi": bmi,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "glucose": glucose,
        "cholesterol": cholesterol,
        "sex": sex,
        "smoking": smoking,
        "physical_activity": physical_activity,
        "family_history": family_history
    }

def calculate_risk(data):
    risk = 0
    try:
        if float(data["bmi"]) > 25: risk += 1
        if int(data["systolic_bp"]) > 130: risk += 1
        if float(data["cholesterol"]) > 200: risk += 1
        if float(data["glucose"]) > 110: risk += 1
        if data["smoking"] == "yes": risk += 1
        if data["family_history"] == "yes": risk += 1
    except:
        pass
    return min(risk / 6, 1.0)

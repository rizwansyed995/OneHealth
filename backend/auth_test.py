from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- allow browser requests ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Google Fit OAuth Test Running ✅"}

# --- callback endpoint ---
@app.get("/auth/callback")
async def auth_callback(request: Request):
    code = request.query_params.get("code")
    error = request.query_params.get("error")

    if error:
        return {"error": error}
    if not code:
        return {"message": "No authorization code received."}

    print(f"✅ AUTHORIZATION CODE RECEIVED:\n{code}\n")
    return {"authorization_code": code}

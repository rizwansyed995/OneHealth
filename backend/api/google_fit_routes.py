from fastapi import APIRouter, HTTPException
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os, time, json
import datetime
from cache import redis_client

router = APIRouter()

METRICS_CACHE_TTL = 300  # seconds

SCOPES = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.body.read",
]

TOKEN_FILE = "token.json"
CLIENT_SECRET_FILE = "client_secret.json"


@router.get("/google-fit/connect")
def connect_google_fit():
    """Authorize app and save token"""
    if not os.path.exists(CLIENT_SECRET_FILE):
        raise HTTPException(status_code=404, detail="Missing client_secret.json file")

    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, scopes=SCOPES)
    creds = flow.run_local_server(port=8083, access_type="offline", prompt="consent")


    with open(TOKEN_FILE, "w") as token:
        token.write(creds.to_json())

    return {"message": "Google Fit connected successfully!"}


@router.get("/get-metrics")
async def get_metrics():
    if not os.path.exists(TOKEN_FILE):
        raise HTTPException(status_code=401, detail="Google Fit not connected")

    today = datetime.datetime.now()
    cache_key = f"fit:metrics:{today.date().isoformat()}"

    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    service = build("fitness", "v1", credentials=creds)

    end_time = int(time.time() * 1000)
    start_of_day = datetime.datetime(today.year, today.month, today.day)
    start_time = int(start_of_day.timestamp() * 1000)

    try:
        body = {
            "aggregateBy": [
                {"dataTypeName": "com.google.step_count.delta"},
                {"dataTypeName": "com.google.heart_rate.bpm"},
                {"dataTypeName": "com.google.weight"},
            ],
            "bucketByTime": {"durationMillis": 24 * 60 * 60 * 1000},
            "startTimeMillis": start_time,
            "endTimeMillis": end_time,
        }

        resp = (
            service.users()
            .dataset()
            .aggregate(userId="me", body=body)
            .execute()
        )

        steps = 0
        avg_hr = 0
        weight = None

        if "bucket" in resp:
            for bucket in resp["bucket"]:
                for dataset in bucket["dataset"]:
                    data_type = dataset["dataSourceId"]

                    if "step_count.delta" in data_type:
                        for point in dataset["point"]:
                            steps += point["value"][0].get("intVal", 0)

                    elif "heart_rate.bpm" in data_type:
                        hr_values = [v["fpVal"] for p in dataset["point"] for v in p["value"]]
                        if hr_values:
                            avg_hr = round(sum(hr_values) / len(hr_values), 1)

                    elif "weight" in data_type:
                        weights = [v["fpVal"] for p in dataset["point"] for v in p["value"]]
                        if weights:
                            weight = weights[-1]

        result = {
            "steps": steps,
            "average_heart_rate": avg_hr,
            "weight": weight,
        }

        await redis_client.set(cache_key, json.dumps(result), ex=METRICS_CACHE_TTL)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch: {e}")


@router.get("/google-fit/sources")
def list_sources():
    """List available data sources"""
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    service = build("fitness", "v1", credentials=creds)

    data_sources = service.users().dataSources().list(userId="me").execute()
    return data_sources

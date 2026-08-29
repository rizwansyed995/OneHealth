"""
Integration tests for the /auth endpoints.

These hit the real MongoDB instance configured in .env (MONGO_URI), using a
throwaway, randomly generated "pytest_*" email per run so it never collides
with real users. Test users are left in the DB (harmless, uniquely named) -
to bulk-clean them later, delete any user/patient doc matching an email that
starts with "pytest_".

Run with:
    pytest test_api.py -v
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="module")
def client():
    # Used as a context manager so a single event loop/portal stays alive
    # across all requests in this module - Motor's client binds to the
    # first loop it sees, so per-request loops break it.
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user():
    email = f"pytest_{uuid.uuid4().hex[:10]}@example.com"
    password = "TestPassword123"
    return {"email": email, "password": password, "role": "patient"}


def test_register_new_user(client, test_user):
    res = client.post("/auth/register", json=test_user)
    assert res.status_code == 200
    assert res.json()["message"] == "User registered successfully"


def test_register_duplicate_email_fails(client, test_user):
    client.post("/auth/register", json=test_user)
    res = client.post("/auth/register", json=test_user)
    assert res.status_code == 400
    assert res.json()["detail"] == "Email already registered"


def test_login_with_correct_credentials(client, test_user):
    client.post("/auth/register", json=test_user)
    res = client.post(
        "/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_with_wrong_password_fails(client, test_user):
    client.post("/auth/register", json=test_user)
    res = client.post(
        "/auth/login",
        json={"email": test_user["email"], "password": "WrongPassword"},
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"


def test_login_nonexistent_user_fails(client):
    res = client.post(
        "/auth/login",
        json={"email": "nobody_here@example.com", "password": "whatever"},
    )
    assert res.status_code == 401


def test_get_me_requires_auth(client):
    res = client.get("/auth/me")
    assert res.status_code == 401


def test_get_me_with_valid_token(client, test_user):
    client.post("/auth/register", json=test_user)
    login_res = client.post(
        "/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    token = login_res.json()["access_token"]

    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == test_user["email"]
    assert body["role"] == "patient"

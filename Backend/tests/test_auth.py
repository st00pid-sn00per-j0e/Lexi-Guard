import pytest

# Requires MongoDB running (e.g. docker-compose or CI service)


@pytest.mark.asyncio
async def test_signup_and_login(client):
    email = "test-auth@example.com"
    payload = {
        "email": email,
        "password": "SecurePass123!",
        "first_name": "Test",
        "last_name": "User",
        "account_type": "individual",
    }
    r = await client.post("/api/auth/signup", json=payload)
    # 201 created or 400 if email already exists from previous run
    assert r.status_code in (201, 400)
    if r.status_code == 201:
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

    r2 = await client.post("/api/auth/login", json={"email": email, "password": "SecurePass123!"})
    assert r2.status_code == 200

    # HttpOnly cookies should be set by backend; AsyncClient doesn't automatically persist cookies
    # across separate requests in this test harness, so re-use the set-cookie header if present.
    cookie_header = r2.headers.get("set-cookie")
    assert cookie_header is not None

    r3 = await client.get(
        "/api/auth/me",
        headers={"Cookie": cookie_header},
    )
    assert r3.status_code == 200
    assert r3.json()["email"] == email


import uuid

import pytest
from bson import ObjectId

from app.main import app
from app.services.contracts_store import contracts_collection


async def _signup(client, email: str) -> str:
    response = await client.post(
        "/api/auth/signup",
        json={
            "email": email,
            "password": "SecurePass123!",
            "first_name": "Contract",
            "last_name": "Owner",
            "account_type": "individual",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_uploaded_contracts_use_user_scoped_collection(client, monkeypatch):
    def fake_process_pdf_sync(*_args, **_kwargs):
        return {
            "summary": "Synthetic analysis summary.",
            "full_text": "Synthetic uploaded contract text.",
            "clauses": [
                {
                    "title": "Payment Terms",
                    "text": "Payment is due within 30 days.",
                    "index": 1,
                    "category": "commercial",
                    "confidence": 0.99,
                    "summary": "Standard payment term.",
                }
            ],
            "risk_analysis": {"risk_level": "low"},
        }

    monkeypatch.setattr(
        "app.tasks.analyze_contract.process_pdf_sync",
        fake_process_pdf_sync,
    )

    suffix = uuid.uuid4().hex
    owner_email = f"contracts-owner-{suffix}@example.com"
    other_email = f"contracts-other-{suffix}@example.com"
    collection = contracts_collection(app.db)

    try:
        owner_token = await _signup(client, owner_email)
        other_token = await _signup(client, other_email)
        owner_headers = {"Authorization": f"Bearer {owner_token}"}
        other_headers = {"Authorization": f"Bearer {other_token}"}

        upload = await client.post(
            "/api/contracts",
            headers=owner_headers,
            data={"name": f"Owned Contract {suffix}", "client": "Acme Corp"},
            files={
                "file": (
                    "owned-contract.pdf",
                    b"%PDF-1.4\nsynthetic contract payload\n%%EOF",
                    "application/pdf",
                )
            },
        )
        assert upload.status_code == 201, upload.text
        contract = upload.json()
        contract_id = contract["id"]
        owner_user_id = contract["user_id"]

        stored = await collection.find_one(
            {"_id": ObjectId(contract_id), "user_id": owner_user_id}
        )
        assert stored is not None
        assert stored["name"] == f"Owned Contract {suffix}"
        assert stored["user_id"] == owner_user_id

        legacy_contract = await app.db.contracts.find_one({"_id": ObjectId(contract_id)})
        assert legacy_contract is None

        owner_list = await client.get("/api/contracts", headers=owner_headers)
        assert owner_list.status_code == 200, owner_list.text
        assert contract_id in {item["id"] for item in owner_list.json()}

        other_list = await client.get("/api/contracts", headers=other_headers)
        assert other_list.status_code == 200, other_list.text
        assert contract_id not in {item["id"] for item in other_list.json()}

        other_get = await client.get(f"/api/contracts/{contract_id}", headers=other_headers)
        assert other_get.status_code == 404

        other_status = await client.get(
            f"/api/contracts/{contract_id}/analysis-status",
            headers=other_headers,
        )
        assert other_status.status_code == 404

        owner_report = await client.get(
            f"/api/contracts/{contract_id}/report.pdf",
            headers=owner_headers,
        )
        assert owner_report.status_code == 200, owner_report.text
        assert owner_report.headers["content-type"] == "application/pdf"
        assert owner_report.content.startswith(b"%PDF-1.4")

        other_report = await client.get(
            f"/api/contracts/{contract_id}/report.pdf",
            headers=other_headers,
        )
        assert other_report.status_code == 404

        other_delete = await client.delete(
            f"/api/contracts/{contract_id}",
            headers=other_headers,
        )
        assert other_delete.status_code == 404

        owner_get = await client.get(f"/api/contracts/{contract_id}", headers=owner_headers)
        assert owner_get.status_code == 200, owner_get.text
        assert owner_get.json()["id"] == contract_id
    finally:
        await collection.delete_many({"name": f"Owned Contract {suffix}"})
        await app.db.users.delete_many({"email": {"$in": [owner_email, other_email]}})

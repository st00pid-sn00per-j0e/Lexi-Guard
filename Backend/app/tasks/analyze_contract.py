import logging
from datetime import datetime

from bson import ObjectId
from pymongo import MongoClient

from app.celery_app import celery_app
from app.config import settings
from app.schemas.contract import AnalysisStatus, RiskLevel, ContractStatus

from app.services.ai_client import process_pdf_sync
from app.services.contracts_store import contracts_collection

logger = logging.getLogger(__name__)


def _get_db():
    client = MongoClient(settings.MONGO_URI)
    return client[settings.MONGO_DB_NAME], client


def _analyze_contract_logic(contract_id: str, user_id: str, company_id: str = None) -> dict:
    db, client = _get_db()
    try:
        if not user_id:
            logger.error("Missing user_id for contract analysis task: %s", contract_id)
            return {"contract_id": contract_id, "status": AnalysisStatus.FAILED.value}

        try:
            obj_id = ObjectId(contract_id)
        except Exception:
            logger.error("Invalid contract_id: %s", contract_id)
            return {"contract_id": contract_id, "status": AnalysisStatus.FAILED.value}

        contracts_store = contracts_collection(db)
        owner_filter = {"_id": obj_id, "user_id": user_id}

        contract = contracts_store.find_one(owner_filter)
        if not contract:
            logger.error("Contract not found for user: contract=%s user=%s", contract_id, user_id)
            return {"contract_id": contract_id, "status": AnalysisStatus.FAILED.value}

        contracts_store.update_one(
            owner_filter,
            {"$set": {"analysis_status": AnalysisStatus.PROCESSING.value}},
        )

        file_content = contract.get("file_content")
        if not file_content:
            contracts_store.update_one(
                owner_filter,
                {
                    "$set": {
                        "analysis_status": AnalysisStatus.FAILED.value,
                        "analysis_error": "No file content stored for contract",
                    }
                },
            )
            return {"contract_id": contract_id, "status": AnalysisStatus.FAILED.value}

        ai_result = process_pdf_sync(
            file_content,
            filename=contract.get("name") or "document.pdf",
            content_type=contract.get("content_type") or "application/pdf",
        )

        if not ai_result:
            contracts_store.update_one(
                owner_filter,
                {
                    "$set": {
                        "analysis_status": AnalysisStatus.FAILED.value,
                        "analysis_error": "AI analysis service unavailable",
                        "analyzed_at": datetime.utcnow().isoformat(),
                    }
                },
            )
            return {"contract_id": contract_id, "status": AnalysisStatus.FAILED.value}

        clauses = ai_result.get("clauses", [])
        legal_bert_resp = ai_result.get("legal_bert_response")
        report_pdf_bytes = None
        if legal_bert_resp:
            import httpx
            from app.config import settings
            url = f"{settings.AI_API_BASE_URL.rstrip('/')}/api/v1/generate-pdf"
            try:
                with httpx.Client(timeout=60.0) as sync_client:
                    ai_pdf_resp = sync_client.post(url, json=legal_bert_resp)
                    if ai_pdf_resp.status_code == 200:
                        report_pdf_bytes = ai_pdf_resp.content
            except Exception as e:
                logger.error(f"Failed to fetch PDF report: {e}")

        update_fields = {
            "summary": ai_result.get("executive_summary") or ai_result.get("summary", ""),
            "clauses": clauses,
            "total_clauses": len(clauses),
            "full_text": ai_result.get("full_text", ""),
            "analysis_status": AnalysisStatus.COMPLETED.value,
            "status": ContractStatus.REVIEW_COMPLETED.value,
            "analysis_error": None,
            "analyzed_at": datetime.utcnow().isoformat(),
            "legal_bert_response": legal_bert_resp,
        }


        if report_pdf_bytes:
            update_fields["report_file_content"] = report_pdf_bytes

        risk_level = ai_result.get("risk_analysis", {}).get("risk_level")
        if risk_level and risk_level.capitalize() in {s.value for s in RiskLevel}:
            update_fields["risk_level"] = risk_level.capitalize()

        # If AI returned no clauses, treat it as a failure so the UI doesn't poll forever.
        if not clauses:
            contracts_store.update_one(
                owner_filter,
                {
                    "$set": {
                        "analysis_status": AnalysisStatus.FAILED.value,
                        "analysis_error": "AI analysis returned empty clauses",
                        "analyzed_at": datetime.utcnow().isoformat(),
                    }
                },
            )
            logger.warning(
                "Analysis failed for contract %s: empty clauses (user=%s)",
                contract_id,
                user_id,
            )
            return {"contract_id": contract_id, "status": AnalysisStatus.FAILED.value}

        contracts_store.update_one(owner_filter, {"$set": update_fields})
        logger.info("Analysis completed for contract %s", contract_id)
        return {"contract_id": contract_id, "status": AnalysisStatus.COMPLETED.value}

    except Exception as exc:
        logger.exception("Analysis failed for contract %s", contract_id)
        try:
            contracts_collection(db).update_one(
                {"_id": ObjectId(contract_id), "user_id": user_id},
                {
                    "$set": {
                        "analysis_status": AnalysisStatus.FAILED.value,
                        "analysis_error": str(exc),
                        "analyzed_at": datetime.utcnow().isoformat(),
                    }
                },
            )
        except Exception:
            logger.exception("Failed to mark contract %s as failed", contract_id)
        return {"contract_id": contract_id, "status": AnalysisStatus.FAILED.value}
    finally:
        client.close()

@celery_app.task(name="analyze_contract", bind=True, max_retries=2)
def analyze_contract_task(self, contract_id: str, user_id: str, company_id: str = None) -> dict:
    return _analyze_contract_logic(contract_id, user_id, company_id)


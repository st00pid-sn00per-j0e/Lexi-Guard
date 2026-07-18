"""
Client for the AI API (e.g. PDF processing on port 8000).
"""
import logging
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

def _ai_base() -> str:
    return settings.AI_API_BASE_URL.rstrip("/")


async def process_pdf(
    file_content: bytes,
    *,
    filename: str = "document.pdf",
    content_type: str = "application/pdf",
) -> Optional[dict[str, Any]]:
    """
    Send the PDF to the AI API for processing. Returns the response JSON
    (full_text, summary, clauses, total_clauses, etc.) or None on failure.

    IMPORTANT: Must include the required form fields to match process_pdf_sync,
    otherwise the AI API may reject the request with 400 Bad Request.
    """
    path = settings.AI_API_PROCESS_PATH.lstrip("/")
    url = f"{_ai_base()}/{path}"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                data={
                    "max_clauses": 50,
                    "interpret_clauses": True,
                    "generate_negotiation_points": True,
                    "compare_to_market": False,
                },
                files={"file": (filename, file_content, content_type)},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.warning("AI API request failed: %s", e)
        return None
    except Exception as e:
        logger.exception("Unexpected error calling AI API: %s", e)
        return None



def process_pdf_sync(
    file_content: bytes,
    *,
    filename: str = "document.pdf",
    content_type: str = "application/pdf",
) -> Optional[dict[str, Any]]:
    """Sync variant for Celery workers.

    LexiGuard expects a response shaped like:
      - clauses: list
      - summary or executive_summary
      - full_text
      - risk_analysis: { risk_level: "Low"|"Medium"|"High" }

    Legal-Bert's /api/v1/analyze/file returns:
      - clauses
      - executive_summary
      - full_text is not present
      - risk_analysis.overall_score + risk_analysis.risk_level (e.g. "Critical"/"High"/etc)

    This function adapts Legal-Bert output into the LexiGuard shape.
    """
    path = settings.AI_API_PROCESS_PATH.lstrip("/")
    url = f"{_ai_base()}/{path}"

    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                url,
                data={
                    # Legal-Bert accepts these as Form fields
                    "max_clauses": 50,
                    "interpret_clauses": True,
                    "generate_negotiation_points": True,
                    "compare_to_market": False,
                },
                files={"file": (filename, file_content, content_type)},
            )
            response.raise_for_status()
            data = response.json()

        # Adapt response to LexiGuard expectations
        raw_clauses = data.get("clauses", []) or []

        def _clause_map(c: Any) -> dict[str, Any]:
            if not isinstance(c, dict):
                return {
                    "title": "Clause",
                    "category": "Uncategorized",
                    "confidence": 0.0,
                    "summary": "",
                    "text": str(c) if c is not None else "",
                }

            title = c.get("reference") or c.get("title") or c.get("clause_reference") or c.get("category") or "Clause"
            category = c.get("category") or "Uncategorized"

            # Legal-Bert ExtractedClause uses:
            #   text, reference, category, confidence
            confidence = c.get("confidence", 0.0)
            try:
                confidence = float(confidence)
            except Exception:
                confidence = 0.0

            # LexiGuard wants:
            #   summary + text
            # Legal-Bert doesn't return a separate summary/explanation per clause in ExtractedClause.
            summary = c.get("explanation") or c.get("summary") or ""
            clause_text = c.get("text") or c.get("content") or c.get("original_text") or ""

            return {
                "title": str(title),
                "category": str(category),
                "confidence": confidence,
                "summary": str(summary or ""),
                "text": str(clause_text or ""),
            }

        adapted: dict[str, Any] = {
            "clauses": [_clause_map(c) for c in raw_clauses],
            "executive_summary": data.get("executive_summary", ""),
            # LexiGuard stores full_text; Legal-Bert doesn't return it. Keep empty.
            "full_text": data.get("metadata", {}).get("extracted_text", "")
            or data.get("full_text", "")
            or "",
            "summary": data.get("executive_summary", ""),
            "risk_analysis": data.get("risk_analysis", {} ) or {},
            "legal_bert_response": data,
        }


        # Normalize risk_level values to LexiGuard enum: Low/Medium/High
        # Legal-Bert risk levels appear to include: "Critical"/"High"/"Medium"/"Low"
        rl = adapted["risk_analysis"].get("risk_level")
        if isinstance(rl, str):
            rl_norm = rl.strip().lower()
            if rl_norm == "critical":
                adapted["risk_analysis"]["risk_level"] = "High"
            else:
                adapted["risk_analysis"]["risk_level"] = rl[:1].upper() + rl[1:].lower()

        return adapted

    except httpx.HTTPError as e:
        logger.warning("AI API request failed: %s", e)
        return None
    except Exception as e:
        logger.exception("Unexpected error calling AI API: %s", e)
        return None


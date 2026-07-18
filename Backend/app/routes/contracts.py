from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import Response
from bson import ObjectId

from app.schemas.contract import AnalysisStatus, ContractStatus, RiskLevel
from app.services.contracts_store import contracts_collection
from app.services.report_pdf import build_contract_report_pdf
from app.tasks.analyze_contract import _analyze_contract_logic

from .auth import get_current_user_from_access_token

router = APIRouter()


def serialize_doc(doc):
    if doc is None:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.pop("file_content", None)
    doc.pop("report_file_content", None)
    binary_keys = [k for k, v in doc.items() if isinstance(v, bytes)]
    for k in binary_keys:
        doc.pop(k)
    return doc


def safe_report_filename(name: str) -> str:
    filename = "".join(char if char.isalnum() or char in ("-", "_") else "_" for char in (name or ""))
    filename = filename.strip("_") or "contract"
    return f"{filename[:80]}-analysis-report.pdf"


@router.get("", response_model=List[dict])
async def get_contracts(
    request: Request,
    scope: str = Query("personal"),
    current_user: dict = Depends(get_current_user_from_access_token),
):
    if scope not in {"personal", "company"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scope")

    db = request.app.db
    contracts_store = contracts_collection(db)

    user_id = str(current_user["_id"])
    account_type = current_user.get("account_type")
    role = current_user.get("role")

    # Authorization rules (repo model):
    # - Personal contracts: any authenticated user can access their own personal scope.
    # - Company contracts:
    #   - only company admins can upload/delete
    #   - but company members can view company contracts belonging to their company
    if scope == "company":
        if account_type != "company" or not current_user.get("company_id"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Not a company member.")

        company_id = str(current_user["company_id"])
        query = {"company_id": company_id, "scope": "company"}
    else:
        # personal
        query = {"user_id": user_id, "scope": "personal"}

    contracts = await contracts_store.find(query).sort("date", -1).to_list(length=100)

    formatted = []
    for c in contracts:
        c = dict(c)
        c["id"] = str(c.pop("_id"))
        c.pop("file_content", None)
        c.pop("report_file_content", None)
        c["user_id"] = str(c.get("user_id")) if c.get("user_id") else None
        c["company_id"] = str(c.get("company_id")) if c.get("company_id") else None
        c["scope"] = c.get("scope", "personal")
        formatted.append(c)

    return formatted



@router.get("/{contract_id}/analysis-status", response_model=dict)
async def get_contract_analysis_status(
    request: Request,
    contract_id: str,
    user: dict = Depends(get_current_user_from_access_token),
):
    db = request.app.db
    contracts_store = contracts_collection(db)

    try:
        obj_id = ObjectId(contract_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract ID"
        )

    account_type = user.get("account_type")
    company_id = user.get("company_id")
    user_id = str(user["_id"])

    # Resolve scope-based authorization by checking the contract's scope/company_id.
    contract = await contracts_store.find_one(
        {"_id": obj_id},
        {
            "_id": 1,
            "scope": 1,
            "user_id": 1,
            "company_id": 1,
            "analysis_status": 1,
            "analysis_error": 1,
            "summary": 1,
            "clauses": 1,
            "total_clauses": 1,
            "risk_level": 1,
            "full_text": 1,
            "analyzed_at": 1,
        },
    )

    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    contract_scope = contract.get("scope") or "personal"

    if contract_scope == "personal":
        if str(contract.get("user_id")) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    elif contract_scope == "company":
        if account_type != "company" or not company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        if str(contract.get("company_id")) != str(company_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract scope")

    return {
        "contract_id": str(contract["_id"]),
        "analysis_status": contract.get("analysis_status", AnalysisStatus.PENDING.value),
        "analysis_error": contract.get("analysis_error"),
        "summary": contract.get("summary", ""),
        "clauses": contract.get("clauses", []),
        "total_clauses": contract.get("total_clauses", 0),
        "risk_level": contract.get("risk_level"),
        "full_text": contract.get("full_text", ""),
        "analyzed_at": contract.get("analyzed_at"),
        "report_url": (
            f"/api/contracts/{contract['_id']}/report.pdf"
            if contract.get("analysis_status") == AnalysisStatus.COMPLETED.value
            else None
        ),
    }



@router.get("/{contract_id}/report.pdf")
async def download_contract_report(
    request: Request,
    contract_id: str,
    user: dict = Depends(get_current_user_from_access_token),
):
    db = request.app.db
    contracts_store = contracts_collection(db)

    try:
        obj_id = ObjectId(contract_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract ID"
        )

    account_type = user.get("account_type")
    company_id = user.get("company_id")
    user_id = str(user["_id"])

    contract = await contracts_store.find_one({"_id": obj_id})
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    contract_scope = contract.get("scope") or "personal"

    if contract_scope == "personal":
        if str(contract.get("user_id")) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    elif contract_scope == "company":
        if account_type != "company" or not company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        if str(contract.get("company_id")) != str(company_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract scope")

    if contract.get("analysis_status") != AnalysisStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Analysis report is available only after analysis completes",
        )

    filename = safe_report_filename(contract.get("name") or "contract")

    stored_pdf_buffer = contract.get("report_file_content")
    if stored_pdf_buffer:
        pdf_bytes = bytes(stored_pdf_buffer)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    pdf_bytes = build_contract_report_pdf(contract)
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )



@router.get("/{contract_id}", response_model=dict)
async def get_contract(
    request: Request,
    contract_id: str,
    user: dict = Depends(get_current_user_from_access_token),
):
    db = request.app.db
    contracts_store = contracts_collection(db)

    try:
        obj_id = ObjectId(contract_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract ID"
        )

    account_type = user.get("account_type")
    company_id = user.get("company_id")
    user_id = str(user["_id"])

    contract = await contracts_store.find_one({"_id": obj_id})
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    contract_scope = contract.get("scope") or "personal"

    if contract_scope == "personal":
        if str(contract.get("user_id")) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    elif contract_scope == "company":
        if account_type != "company" or not company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        if str(contract.get("company_id")) != str(company_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract scope")

    return serialize_doc(contract)



@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_contract(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    client: Optional[str] = Form(None),
    scope: str = Form("personal"),
    user: dict = Depends(get_current_user_from_access_token),
):
    user_id = str(user["_id"])
    contracts_store = contracts_collection(request.app.db)
    file_content = await file.read()

    if scope not in {"personal", "company"}:
        raise HTTPException(status_code=400, detail="Invalid contract scope")

    if scope == "company":
        if user.get("account_type") != "company" or user.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only company admins can add company-wide contracts.",
            )
        if not user.get("company_id"):
            raise HTTPException(status_code=403, detail="Company contract requires company_id.")

        target_company_id = str(user.get("company_id"))
        contract_data = {
            "user_id": user_id,
            "company_id": target_company_id,
            "company_name": user.get("company_name"),
            "scope": scope,
            "name": name or file.filename or "Untitled",
            "client": client or "Unknown",
            "risk_level": RiskLevel.LOW.value,
            "date": datetime.utcnow().isoformat(),
            "status": ContractStatus.PENDING_REVIEW.value,
            "analysis_status": AnalysisStatus.PROCESSING.value,
            "analysis_error": None,
            "full_text": "",
            "summary": "",
            "clauses": [],
            "total_clauses": 0,
            "file_content": file_content,
            "content_type": file.content_type,
            "file_size": len(file_content),
        }
    else:
        contract_data = {
            "user_id": user_id,
            "company_id": None,
            "company_name": None,
            "scope": "personal",
            "name": name or file.filename or "Untitled",
            "client": client or "Unknown",
            "risk_level": RiskLevel.LOW.value,
            "date": datetime.utcnow().isoformat(),
            "status": ContractStatus.PENDING_REVIEW.value,
            "analysis_status": AnalysisStatus.PROCESSING.value,
            "analysis_error": None,
            "full_text": "",
            "summary": "",
            "clauses": [],
            "total_clauses": 0,
            "file_content": file_content,
            "content_type": file.content_type,
            "file_size": len(file_content),
        }

    result = await contracts_store.insert_one(contract_data)
    background_tasks.add_task(
        _analyze_contract_logic,
        str(result.inserted_id),
        user_id,
        str(user.get("company_id")) if user.get("company_id") else None,
    )

    contract = await contracts_store.find_one({"_id": result.inserted_id, "user_id": user_id})
    return serialize_doc(contract)


@router.delete("/{contract_id}")
async def delete_contract(
    request: Request,
    contract_id: str,
    user: dict = Depends(get_current_user_from_access_token),
):
    user_id = str(user["_id"])
    contracts_store = contracts_collection(request.app.db)

    try:
        obj_id = ObjectId(contract_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract ID")

    contract = await contracts_store.find_one({"_id": obj_id})
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    scope = contract.get("scope") or "personal"

    if scope == "personal":
        if str(contract.get("user_id")) != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own personal contracts.")

    elif scope == "company":
        if user.get("account_type") != "company" or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only company admins can delete company contracts.")

        company_id = contract.get("company_id")
        if not user.get("company_id") or str(company_id) != str(user.get("company_id")):
            raise HTTPException(status_code=403, detail="Contract does not belong to your company.")

    else:
        raise HTTPException(status_code=400, detail="Invalid contract scope.")

    result = await contracts_store.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    return {"message": "Contract deleted successfully"}


@router.patch("/{contract_id}/status")
async def update_contract_status(
    request: Request,
    contract_id: str,
    status_value: str = "",
    user: dict = Depends(get_current_user_from_access_token),
):
    if status_value and status_value not in {s.value for s in ContractStatus}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {[s.value for s in ContractStatus]}",
        )

    contracts_store = contracts_collection(request.app.db)

    try:
        obj_id = ObjectId(contract_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract ID"
        )

    account_type = user.get("account_type")
    company_id = user.get("company_id")
    role = user.get("role")
    user_id = str(user["_id"])

    # Load contract scope first for authorization.
    contract = await contracts_store.find_one({"_id": obj_id}, {"scope": 1, "user_id": 1, "company_id": 1})
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    contract_scope = contract.get("scope") or "personal"

    if contract_scope == "personal":
        if str(contract.get("user_id")) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    elif contract_scope == "company":
        # Only company admins can change status of company-wide contracts.
        if account_type != "company" or role != "admin" or not company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        if str(contract.get("company_id")) != str(company_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract scope")

    result = await contracts_store.update_one(
        {"_id": obj_id},
        {"$set": {"status": status_value}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    return {"message": "Status updated successfully"}



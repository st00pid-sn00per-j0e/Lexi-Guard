from enum import Enum


class ContractStatus(str, Enum):
    PENDING_REVIEW = "Pending Review"
    IN_REVIEW = "In Review"
    REVIEW_COMPLETED = "Review Completed"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    EXPIRED = "Expired"



class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


def normalize_status(value: str) -> str:
    """Accept any string; return if in enum else default."""
    if not value:
        return ContractStatus.PENDING_REVIEW.value
    for s in ContractStatus:
        if s.value == value:
            return value
    return value  # Allow custom values from AI/future use

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if isinstance(v, ObjectId):
            return str(v)
        return v

class User(BaseModel):
    id: Optional[PyObjectId] = None
    email: EmailStr
    password_hash: str
    first_name: str
    last_name: str
    account_type: str  # "individual" or "company"
    company_name: Optional[str] = None
    company_id: Optional[PyObjectId] = None  # Links members to the main company account
    role: str = "admin"  # "admin" or "member"
    ai_model: Optional[str] = "Legal Bert By Nizami"
    is_2fa_enabled: bool = False
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()


    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}


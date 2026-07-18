from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    account_type: str = "individual"
    company_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    invite_token: Optional[str] = None  # ADDED: For processing invite links


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    account_type: str
    company_name: Optional[str] = None
    company_id: Optional[str] = None  # ADDED: Crucial for RBAC scoping
    role: str = "member"  # ADDED: Crucial for delete/upload permissions

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str


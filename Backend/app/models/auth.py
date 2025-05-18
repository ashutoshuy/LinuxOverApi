# app/models/auth.py
from pydantic import BaseModel, Field
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str = Field(..., example="johndoe")
    password: str = Field(..., example="SecurePass123")

class TokenValidationRequest(BaseModel):
    username: str = Field(..., example="johndoe")
    token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")

class TokenValidationResponse(BaseModel):
    message: str

# app/models/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# User models for requests and responses
class UserBase(BaseModel):
    username: str = Field(..., example="johndoe")
    email: EmailStr = Field(..., example="john.doe@example.com")

class UserCreate(UserBase):
    first_name: str = Field(..., example="John")
    last_name: str = Field(..., example="Doe")
    password: str = Field(..., example="SecurePass123")
    mobile_no: str = Field(..., example="1234567890")

class UserResponse(UserBase):
    first_name: str
    last_name: str
    mobile_no: str
    is_api_key_generated: bool
    is_paid: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserInDB(UserResponse):
    id: int
    bill_amount: float
    
    class Config:
        orm_mode = True

# app/models/scan.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ApiKeyBase(BaseModel):
    username: str = Field(..., example="johndoe")
    api_type: str = Field(..., example="free")

class ApiKeyCreate(ApiKeyBase):
    jwt_token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")

class ApiKeyResponse(ApiKeyBase):
    apikey: str
    count: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class ApiKeyInDB(ApiKeyResponse):
    id: int
    
    class Config:
        orm_mode = True

class ScanRequest(BaseModel):
    domain: str = Field(..., example="example.com")
    api_key: str = Field(..., example="14f3ff2c-97e7-4ec5-8484-59953d5d3b40")

class ScanResponse(BaseModel):
    tool: str
    domain: str
    output: str

class ScanHistoryItem(BaseModel):
    id: int
    domain: str
    tool: str
    scan_time: datetime
    
    class Config:
        orm_mode = True

class ScanHistoryDetailItem(ScanHistoryItem):
    result: str
    
    class Config:
        orm_mode = True

class PaymentRequest(BaseModel):
    username: str = Field(..., example="johndoe")
    jwt_token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    amount: float = Field(..., example=49.99)

class ToolInfo(BaseModel):
    name: str
    description: str
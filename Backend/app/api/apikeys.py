# app/api/apikeys.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db, ApiKey
from app.core.apikey import generate_and_store_api_key, get_user_api_keys, get_api_key_count
from app.core.security import authenticate_admin
from app.models.scan import ApiKeyCreate, ApiKeyResponse

router = APIRouter(tags=["api keys"])

@router.post("/generate-api-key", response_model=dict)
async def generate_api_key(
    request: ApiKeyCreate,
    db: Session = Depends(get_db)
):
    """
    Generate a new API key for a user. Can be free or paid type.
    """
    # Validate API type
    if request.api_type not in ["free", "paid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API type must be 'free' or 'paid'"
        )
    
    api_key = generate_and_store_api_key(
        request.username, 
        request.api_type, 
        request.jwt_token,
        db
    )
    
    return {"api_key": api_key}

@router.get("/get-api-keys/{username}", response_model=List[ApiKeyResponse])
async def get_api_keys(
    username: str,
    jwt_token: str,
    db: Session = Depends(get_db)
):
    """
    Get all API keys for a specific user.
    """
    api_keys = get_user_api_keys(username, jwt_token, db)
    return api_keys

@router.get("/get-count/{api_key}", response_model=dict)
async def get_count_endpoint(
    api_key: str,
    db: Session = Depends(get_db)
):
    """
    Get the usage count for a specific API key.
    """
    count = get_api_key_count(api_key, db)
    return {"count": count}

# Admin-only routes
@router.get("/fetch-all", response_model=List[ApiKeyResponse])
async def fetch_all_api_keys(
    admin_secret_key: str,
    db: Session = Depends(get_db)
):
    """
    Admin only: Get all API keys in the system.
    """
    authenticate_admin(admin_secret_key)
    
    api_keys = db.query(ApiKey).all()
    return api_keys

@router.post("/increment-count/{api_key}")
async def increment_count_endpoint(
    api_key: str,
    admin_secret_key: str,
    db: Session = Depends(get_db)
):
    """
    Admin only: Manually increment the count for a specific API key.
    """
    authenticate_admin(admin_secret_key)
    
    api_key_record = db.query(ApiKey).filter(ApiKey.apikey == api_key).first()
    
    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    api_key_record.count += 1
    db.commit()
    
    return {"message": "Count incremented successfully"}
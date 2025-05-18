# app/core/apikey.py
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database import ApiKey, User
from app.core.security import validate_token
from app.config import settings

def generate_api_key():
    """Generate a unique API key"""
    return str(uuid.uuid4())

def generate_and_store_api_key(username: str, api_type: str, jwt_token: str, db: Session):
    """Generate and store API key for a user"""
    # Validate JWT token
    is_valid, message = validate_token(username, jwt_token, db)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)
    
    # Check if API key already exists for this type
    existing_key = db.query(ApiKey).filter(
        ApiKey.username == username, 
        ApiKey.api_type == api_type
    ).first()
    
    if existing_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="API key already generated for this type"
        )
    
    # Generate new API key
    api_key = generate_api_key()
    
    if api_type == 'free':
        # Free tier logic
        new_key = ApiKey(username=username, apikey=api_key, api_type=api_type)
        db.add(new_key)
        
        # Update user record
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.is_api_key_generated = True
        
    elif api_type == 'paid':
        # Paid tier logic - check if user is paid
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.is_paid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="User is not a paid user"
            )
        
        new_key = ApiKey(username=username, apikey=api_key, api_type=api_type)
        db.add(new_key)
        user.is_api_key_generated = True
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid API type. Use 'free' or 'paid'"
        )
    
    db.commit()
    return api_key

def get_user_api_keys(username: str, jwt_token: str, db: Session):
    """Get all API keys for a user"""
    is_valid, message = validate_token(username, jwt_token, db)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)
    
    api_keys = db.query(ApiKey).filter(ApiKey.username == username).all()
    
    if not api_keys:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No API keys found for user"
        )
    
    return api_keys

def authenticate_api_key(api_key: str, db: Session):
    """Authenticate an API key and increment usage count"""
    key_record = db.query(ApiKey).filter(ApiKey.apikey == api_key).first()
    
    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid API key"
        )
    
    # Check usage limits for free tier
    if key_record.api_type == "free" and key_record.count >= settings.API_FREE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
            detail=f"Usage limit of {settings.API_FREE_LIMIT} exceeded for free API"
        )
    
    # Increment usage count
    key_record.count += 1
    db.commit()
    
    return key_record

def verify_api_key_exists(api_key: str, db: Session):
    """Verify an API key exists without incrementing usage count"""
    key_record = db.query(ApiKey).filter(ApiKey.apikey == api_key).first()
    
    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid API key"
        )
    
    return key_record

def get_api_key_count(api_key: str, db: Session):
    """Get usage count for an API key"""
    key_record = db.query(ApiKey).filter(ApiKey.apikey == api_key).first()
    
    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="API key not found"
        )
    
    return key_record.count
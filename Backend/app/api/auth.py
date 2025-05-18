# app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db, User, Login
from app.models.auth import Token, TokenValidationRequest, TokenValidationResponse, LoginRequest
from app.models.user import UserCreate, UserResponse
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    validate_token
)
from app.utils.validators import validate_user_input

router = APIRouter(tags=["authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user with the system.
    """
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | 
        (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Validate user input
    validate_user_input(
        user_data.username,
        user_data.email,
        user_data.password,
        user_data.mobile_no
    )
    
    # Create new user
    
    new_user = User(
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        mobile_no=user_data.mobile_no
    )
    db.add(new_user)
    
    # Create login entry
    hashed_password = get_password_hash(user_data.password)
    new_login = Login(
        username=user_data.username,
        password=hashed_password
    )
    db.add(new_login)
    
    db.commit()
    db.refresh(new_user)
    
    return new_user

# NEW CODE:
@router.post("/login", response_model=Token)
async def login_for_access_token(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(Login).filter(Login.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    # Update user's JWT and last login time
    user.jwt = access_token
    user.last_login_time = datetime.utcnow()
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}
@router.post("/validate-token", response_model=TokenValidationResponse)
async def validate_token_endpoint(
    request: TokenValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Validate a JWT token for a specific username.
    """
    is_valid, message = validate_token(request.username, request.token, db)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    return {"message": message}
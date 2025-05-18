# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db, User
from app.models.user import UserResponse, UserInDB
from app.core.security import validate_token, authenticate_admin, get_current_user
from app.models.scan import PaymentRequest

router = APIRouter(tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get information about the currently authenticated user.
    """
    return current_user

@router.post("/make-payment")
async def make_payment(
    request: PaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Process a payment for a user to upgrade to paid status.
    """
    is_valid, message = validate_token(request.username, request.jwt_token, db)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has paid status"
        )
    
    # Update user's paid status and bill amount
    user.is_paid = True
    user.bill_amount = request.amount
    db.commit()
    
    return {"message": "Payment processed successfully"}

@router.get("/get-paid-status/{username}")
async def get_paid_status(
    username: str,
    jwt_token: str,
    db: Session = Depends(get_db)
):
    """
    Check if a user has paid status.
    """
    is_valid, message = validate_token(username, jwt_token, db)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user.is_paid

@router.get("/get-bill-amount/{username}")
async def get_bill_amount(
    username: str,
    jwt_token: str,
    db: Session = Depends(get_db)
):
    """
    Get the bill amount for a user.
    """
    is_valid, message = validate_token(username, jwt_token, db)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user.bill_amount

# Admin-only routes
@router.get("/fetch-all-users", response_model=List[UserInDB])
async def fetch_all_users(
    admin_secret_key: str,
    db: Session = Depends(get_db)
):
    """
    Admin only: Get information about all users in the system.
    """
    authenticate_admin(admin_secret_key)
    
    users = db.query(User).all()
    return users
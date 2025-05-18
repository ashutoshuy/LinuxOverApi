# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, User, Login

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/login")

def verify_password(plain_password, hashed_password):
    """Verify password against hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Generate password hash"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def validate_token(username: str, token: str, db: Session):
    """Validate JWT token for a given username"""
    user = db.query(Login).filter(Login.username == username).first()
    if not user:
        return False, "User not found"
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_username: str = payload.get("sub")
        if token_username is None:
            return False, "Invalid token"
    
        if username == token_username:
            stored_token = db.query(Login).filter(Login.username == username, Login.jwt == token).first()
            if not stored_token:
                return False, "Invalid Token, Doesn't exist in Backend"

            token_exp = payload.get("exp")
            if token_exp is None or datetime.utcfromtimestamp(token_exp) < datetime.utcnow():
                return False, "Token has expired"

            return True, "Token is valid"
        else:
            return False, "Username and Token don't match"
    except JWTError:
        return False, "Invalid token"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current authenticated user from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).join(Login).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    return user

def authenticate_admin(admin_secret_key: str):
    """Validate admin secret key"""
    if admin_secret_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin secret key"
        )
    return True
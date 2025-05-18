# app/utils/validators.py
import re
from fastapi import HTTPException, status

def validate_email(email: str) -> bool:
    """
    Validate if an email address is in a correct format.
    Returns True if valid, False otherwise.
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

def validate_mobile_number(mobile_no: str) -> bool:
    """
    Validate if a mobile number contains exactly 10 digits.
    Returns True if valid, False otherwise.
    """
    return re.match(r'^\d{10}$', mobile_no) is not None

def validate_domain(domain: str) -> bool:
    """
    Validate if a domain is in a correct format.
    Returns True if valid, False otherwise.
    """
    # Basic domain validation - can be expanded for more detailed checks
    domain_regex = r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
    ip_regex = r'^(\d{1,3}\.){3}\d{1,3}$'
    
    return bool(re.match(domain_regex, domain) or re.match(ip_regex, domain))

def validate_password_strength(password: str) -> bool:
    """
    Validate password strength.
    Returns True if password meets minimum requirements, False otherwise.
    
    Requirements:
    - At least 8 characters
    - Contains at least one digit
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    """
    if len(password) < 8:
        return False
        
    if not any(c.isdigit() for c in password):
        return False
        
    if not any(c.isupper() for c in password):
        return False
        
    if not any(c.islower() for c in password):
        return False
        
    return True

def validate_user_input(username: str, email: str, password: str, mobile_no: str):
    """
    Validate all user input for registration.
    Raises HTTPException with appropriate message if validation fails.
    """
    # Check username length and format
    if len(username) < 3 or len(username) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 30 characters"
        )
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, and underscores"
        )
    
    # Validate email
    if not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Validate mobile number
    if not validate_mobile_number(mobile_no):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number must be exactly 10 digits"
        )
    
    # Validate password strength
    if not validate_password_strength(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and include uppercase, lowercase, and digits"
        )
# app/database.py
import sqlite3
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from app.config import settings

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Define database models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    mobile_no = Column(String)
    is_api_key_generated = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    bill_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    login = relationship("Login", back_populates="user", uselist=False)
    api_keys = relationship("ApiKey", back_populates="user")

class Login(Base):
    __tablename__ = "login"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey("users.username"), unique=True, index=True)
    password = Column(String)
    jwt = Column(String, nullable=True)
    last_login_time = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="login")

class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, ForeignKey("users.username"))
    apikey = Column(String, unique=True, index=True)
    api_type = Column(String)  # 'free' or 'paid'
    count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('username', 'api_type', name='unique_username_api_type'),
    )

class ScanResult(Base):
    __tablename__ = "scan_results"
    
    id = Column(Integer, primary_key=True, index=True)
    apikey = Column(String, ForeignKey("api_keys.apikey"))
    domain = Column(String)
    tool = Column(String)
    result = Column(Text)
    scan_time = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    api_key = relationship("ApiKey")

# Create database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    Base.metadata.create_all(bind=engine)
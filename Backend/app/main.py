# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, init_db
from app.api import auth, apikeys, users, scans

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for security scanning tools with API key authentication",
    version="0.1.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")
app.include_router(apikeys.router, prefix=f"{settings.API_V1_PREFIX}/apikeys")
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users")
app.include_router(scans.router, prefix=f"{settings.API_V1_PREFIX}/scans")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to LinuxOverApi",
        "version": "0.1.0",
        "documentation": "/docs",
    }

# Health check endpoint
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# Initialize the app
@app.on_event("startup")
async def startup_event():
    # Initialize database
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
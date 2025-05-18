# app/api/scans.py
from app.core.apikey import verify_api_key_exists
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db, ScanResult
from app.core.scanner import execute_scan, get_scan_history, get_available_tools
from app.models.scan import ScanRequest, ScanResponse, ScanHistoryItem, ScanHistoryDetailItem, ToolInfo

router = APIRouter(tags=["scanning tools"])

@router.get("/tools", response_model=List[ToolInfo])
async def list_available_tools():
    """
    Get a list of all available scanning tools.
    """
    return get_available_tools()

@router.post("/scan/{tool_name}", response_model=ScanResponse)
async def run_scan(
    tool_name: str,
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a scan using the specified tool.
    """
    result = execute_scan(
        tool_name=tool_name,
        domain=scan_request.domain,
        api_key=scan_request.api_key,
        db=db
    )
    
    return result

@router.post("/scan/dig", response_model=ScanResponse)
async def dig_scan(
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a DNS lookup scan using dig.
    """
    return execute_scan("dig", scan_request.domain, scan_request.api_key, db)

@router.post("/scan/nmap", response_model=ScanResponse)
async def nmap_scan(
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a network scan using nmap.
    """
    return execute_scan("nmap", scan_request.domain, scan_request.api_key, db)

@router.post("/scan/whatweb", response_model=ScanResponse)
async def whatweb_scan(
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a web technology scan using whatweb.
    """
    return execute_scan("whatweb", scan_request.domain, scan_request.api_key, db)

@router.post("/scan/sslscan", response_model=ScanResponse)
async def sslscan_scan(
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute an SSL/TLS scan using sslscan.
    """
    return execute_scan("sslscan", scan_request.domain, scan_request.api_key, db)

@router.post("/scan/subfinder", response_model=ScanResponse)
async def subfinder_scan(
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a subdomain discovery scan using subfinder.
    """
    return execute_scan("subfinder", scan_request.domain, scan_request.api_key, db)

@router.post("/scan/wpscan", response_model=ScanResponse)
async def wpscan_scan(
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a WordPress security scan using wpscan.
    """
    return execute_scan("wpscan", scan_request.domain, scan_request.api_key, db)

@router.post("/scan/nuclei", response_model=ScanResponse)
async def nuclei_scan(
    scan_request: ScanRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a vulnerability scan using nuclei.
    """
    return execute_scan("nuclei", scan_request.domain, scan_request.api_key, db)

@router.get("/history/{api_key}", response_model=List[ScanHistoryItem])
async def get_scan_history_endpoint(
    api_key: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get scan history for a specific API key.
    """
    return get_scan_history(api_key, db, limit)

@router.get("/result/{scan_id}", response_model=ScanHistoryDetailItem)
async def get_scan_result(
    scan_id: int,
    api_key: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed result for a specific scan.
    """        
    verify_api_key_exists(api_key, db)

    # Verify that the API key is valid and the scan belongs to this API key
    scan_result = db.query(ScanResult).filter(
        ScanResult.id == scan_id,
        ScanResult.apikey == api_key
    ).first()
    
    # Verify that the API key exists without incrementing the counter
    
    if not scan_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan result not found or you don't have permission to access it"
        )
    
    return scan_result

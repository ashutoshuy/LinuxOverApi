# app/core/scanner.py
import subprocess
import shlex
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database import ScanResult
from app.core.apikey import authenticate_api_key, verify_api_key_exists

class ScannerTool:
    def __init__(self, name, command_template, description):
        self.name = name
        self.command_template = command_template
        self.description = description

# Define available scanning tools
SCANNER_TOOLS = {
    "dig": ScannerTool(
        name="dig",
        command_template="dig {domain}",
        description="DNS lookup tool that provides information about DNS records"
    ),
    "nmap": ScannerTool(
        name="nmap",
        command_template="nmap {domain}",
        description="Network discovery and security auditing tool"
    ),
    "subfinder": ScannerTool(
        name="subfinder",
        command_template="subfinder -d {domain}",
        description="Subdomain discovery tool"
    ),
    "wpscan": ScannerTool(
        name="wpscan",
        command_template="wpscan --url {domain}",
        description="WordPress security scanner"
    ),
    "whatweb": ScannerTool(
        name="whatweb",
        command_template="whatweb {domain}",
        description="Web scanner that identifies web technologies"
    ),
    "sslscan": ScannerTool(
        name="sslscan",
        command_template="sslscan {domain}",
        description="SSL/TLS scanner that tests SSL/TLS enabled services"
    ),
    "nuclei": ScannerTool(
        name="nuclei",
        command_template="nuclei -u {domain} -t http/technologies/ --silent",
        description="Fast and customizable vulnerability scanner"
    )
}

def get_available_tools():
    """Get a list of all available scanning tools"""
    return [
        {
            "name": tool.name,
            "description": tool.description
        }
        for tool in SCANNER_TOOLS.values()
    ]

def execute_scan(tool_name: str, domain: str, api_key: str, db: Session):
    """Execute a scan using the specified tool"""
    # First, authenticate the API key
    key_record = authenticate_api_key(api_key, db)
    
    # Check if the requested tool exists
    if tool_name not in SCANNER_TOOLS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tool '{tool_name}' not found"
        )
    
    tool = SCANNER_TOOLS[tool_name]
    
    # Format the command with the domain
    command = tool.command_template.format(domain=shlex.quote(domain))
    
    try:
        # Execute the command
        process = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=300  # 5-minute timeout
        )

        print(process)
        
        # Store the result
        scan_result = ScanResult(
            apikey=api_key,
            domain=domain,
            tool=tool_name,
            result=process.stdout
        )
        db.add(scan_result)
        db.commit()


        
        
        return {
            "tool": tool_name,
            "domain": domain,
            "output": process.stdout
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Scan timed out after 5 minutes"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during scan execution: {str(e)}"
        )

def get_scan_history(api_key: str, db: Session, limit: int = 20):
    """Get scan history for a specific API key without incrementing usage count"""
    # Verify the API key exists but don't increment count
    verify_api_key_exists(api_key, db)
    
    # Fetch scan history
    scan_results = db.query(ScanResult).filter(
        ScanResult.apikey == api_key
    ).order_by(
        ScanResult.scan_time.desc()
    ).limit(limit).all()
    
    return scan_results
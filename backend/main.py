from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks, Cookie, Header, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
import uvicorn
from typing import List, Optional
import os
import json
from datetime import datetime, timedelta
import uuid
import shutil
import secrets
import base64
from data_processor import DataProcessor, Chatbot

app = FastAPI()

# Update the CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://mai-six.vercel.app"],  # Your Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the data processor and chatbot
data_processor = DataProcessor()
chatbot = Chatbot()

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Data storage (in a real app, this would be a database)
urls_db = []
pdfs_db = []
activity_db = []
settings = {
    "general": {
        "botName": "Company Assistant",
        "greeting": "Hello! How can I help you with information about our company?",
        "debugMode": False
    },
    "api_keys": {
        "groqApiKey": os.environ.get("GROQ_API_KEY", "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"),
        "cohereApiKey": os.environ.get("COHERE_API_KEY", "R8KB9BMGC7CftCAt1TLHgu9os1NZjieGhsE3j0oI")
    },
    "advanced": {
        "embeddingModel": "embed-english-v3.0",
        "llmModel": "qwen-qwq-32b",
        "maxContext": 4000,
        "autoRefresh": False
    }
}

# Authentication credentials
ADMIN_USERNAME = "manipaladmin"
ADMIN_PASSWORD = "manipal@25"

# Session storage
sessions = {}

# Predefined URLs
predefined_urls = [
    "https://manipaltechnologies.com/",
    "https://manipaltechnologies.com/about-us/",
    "https://manipaltechnologies.com/careers/",
    "https://manipaltechnologies.com/contact-us/",
    "https://manipaltechnologies.com/blogs/",
    "https://manipaltechnologies.com/videos/",
    "https://manipaltechnologies.com/events/",
    "https://manipaltechnologies.com/downloads/",
    "https://manipaltechnologies.com/bfsi/sahibnk/",
    "https://manipaltechnologies.com/bfsi/digital-banking-smart-branches-solutions/",
    "https://manipaltechnologies.com/bfsi/crossfraud-suite/",
    "https://manipaltechnologies.com/bfsi/payment-solutions/",
    "https://manipaltechnologies.com/bfsi/card-management/",
    "https://manipaltechnologies.com/bfsi/secure-print-solution/",
    "https://manipaltechnologies.com/bfsi/financial-inclusion-solution/",
    "https://manipaltechnologies.com/bfsi/branding-communication/",
    "https://manipaltechnologies.com/bfsi/pms/",
    "https://manipaltechnologies.com/bfsi/corporate/",
    "https://manipaltechnologies.com/government/",
    "https://manipaltechnologies.com/publishing/",
    "https://manipaltechnologies.com/retail/",
    "https://www.linkedin.com/company/manipal-technologies-limited/",
    "https://manipaltechnologies.com/who-we-are/",
    "https://manipaltechnologies.com/who-we-are/team",
]

# Load existing data
def load_data():
    global urls_db, pdfs_db, activity_db
    try:
        # Load URLs from data processor
        urls_db = data_processor.get_all_urls()
        
        # Load PDFs from data processor
        pdfs_db = data_processor.get_all_pdfs()
        
        # Load activity from file if it exists
        if os.path.exists("activity.json"):
            with open("activity.json", "r") as f:
                activity_db = json.load(f)
    except Exception as e:
        print(f"Error loading data: {e}")

# Process predefined URLs
def process_predefined_urls():
    print("Processing predefined URLs...")
    results = data_processor.process_urls(predefined_urls)
    
    # Update URLs database with results
    global urls_db
    for result in results:
        # Check if URL already exists in URLs database
        if not any(u["url"] == result["url"] for u in urls_db):
            urls_db.append(result)
            add_activity("url", result["url"])

# Load data and process predefined URLs on startup
@app.on_event("startup")
async def startup_event():
    load_data()
    process_predefined_urls()

# Models
class ChatRequest(BaseModel):
    query: str

class UrlRequest(BaseModel):
    url: str

class UrlDeleteRequest(BaseModel):
    id: str

class PdfDeleteRequest(BaseModel):
    id: str

class GeneralSettings(BaseModel):
    botName: str
    greeting: str
    debugMode: bool

class ApiKeys(BaseModel):
    groqApiKey: str
    cohereApiKey: str

class AdvancedSettings(BaseModel):
    embeddingModel: str
    llmModel: str
    maxContext: int
    autoRefresh: bool

class LoginRequest(BaseModel):
    username: str
    password: str

# Authentication dependency
async def get_current_user(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return sessions[session_id]

# Helper function to add activity
def add_activity(activity_type, name):
    activity_id = str(uuid.uuid4())
    activity_db.append({
        "id": activity_id,
        "type": activity_type,
        "name": name,
        "timestamp": datetime.now().isoformat()
    })
    # Keep only the last 20 activities
    if len(activity_db) > 20:
        activity_db.pop(0)
    
    # Save activity to file
    with open("activity.json", "w") as f:
        json.dump(activity_db, f)
    
    return activity_id

# Background task to process URL
def process_url_task(url: str):
    result = data_processor.process_url(url)
    
    # Update URLs database
    global urls_db
    for i, u in enumerate(urls_db):
        if u["url"] == url:
            urls_db[i] = result
            return
    
    urls_db.append(result)
    
    # Add activity
    add_activity("url", url)

# Background task to process PDF
def process_pdf_task(file_path: str, original_filename: str):
    result = data_processor.process_pdf(file_path, original_filename)
    
    # Update PDFs database
    global pdfs_db
    for i, p in enumerate(pdfs_db):
        if p["filename"] == original_filename:
            pdfs_db[i] = result
            return
    
    pdfs_db.append(result)
    
    # Add activity
    add_activity("pdf", original_filename)

# Login endpoint
@app.post("/login")
async def login(request: LoginRequest, response: Response):
    if request.username == ADMIN_USERNAME and request.password == ADMIN_PASSWORD:
        session_id = secrets.token_hex(16)
        sessions[session_id] = {"username": request.username}
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            max_age=3600,  # 1 hour
            samesite="lax",
            secure=False,  # Set to True in production with HTTPS
        )
        return {"success": True, "message": "Login successful"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Logout endpoint
@app.post("/logout")
async def logout(response: Response, session_id: str = Cookie(None)):
    if session_id and session_id in sessions:
        del sessions[session_id]
    response.delete_cookie(key="session_id")
    return {"success": True, "message": "Logout successful"}

# Check authentication status
@app.get("/auth/status")
async def auth_status(current_user: dict = Depends(get_current_user)):
    return {"authenticated": True, "username": current_user["username"]}

# Chat endpoint (public)
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = chatbot.generate_response(request.query)
        return {"response": response}
    except Exception as e:
        print(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# URL endpoints (protected)
@app.post("/process-url")
async def process_url(
    request: UrlRequest, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Validate URL
        if not request.url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="Invalid URL format")
        
        # Add URL processing to background tasks
        background_tasks.add_task(process_url_task, request.url)
        
        # Return immediate response
        url_id = str(uuid.uuid4())
        result = {
            "id": url_id,
            "url": request.url,
            "added_date": datetime.now().isoformat(),
            "status": "processing"
        }
        
        # Add to URLs database
        urls_db.append(result)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/urls")
async def get_urls(current_user: dict = Depends(get_current_user)):
    return urls_db

@app.delete("/urls/{url_id}")
async def delete_url(
    url_id: str,
    current_user: dict = Depends(get_current_user)
):
    for i, url in enumerate(urls_db):
        if url["id"] == url_id:
            # Remove from URLs database
            urls_db.pop(i)
            
            # Add activity
            add_activity("url_deleted", url["url"])
            
            return {"success": True}
    
    raise HTTPException(status_code=404, detail="URL not found")

# PDF endpoints (protected)
@app.post("/process-pdf")
async def process_pdf(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Check if file is a PDF
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save the file
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Add PDF processing to background tasks
        background_tasks.add_task(process_pdf_task, file_path, file.filename)
        
        # Return immediate response
        pdf_id = str(uuid.uuid4())
        result = {
            "id": pdf_id,
            "filename": file.filename,
            "added_date": datetime.now().isoformat(),
            "status": "processing",
            "size": os.path.getsize(file_path)
        }
        
        # Add to PDFs database
        pdfs_db.append(result)
        
        return result
    except Exception as e:
        # Clean up the file if it exists
        if os.path.exists(f"uploads/{file.filename}"):
            os.remove(f"uploads/{file.filename}")
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pdfs")
async def get_pdfs(current_user: dict = Depends(get_current_user)):
    return pdfs_db

@app.delete("/pdfs/{pdf_id}")
async def delete_pdf(
    pdf_id: str,
    current_user: dict = Depends(get_current_user)
):
    for i, pdf in enumerate(pdfs_db):
        if pdf["id"] == pdf_id:
            # Remove from PDFs database
            pdfs_db.pop(i)
            
            # Add activity
            add_activity("pdf_deleted", pdf["filename"])
            
            return {"success": True}
    
    raise HTTPException(status_code=404, detail="PDF not found")

# Dashboard stats endpoint (protected)
@app.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    # Calculate stats
    total_urls = len(urls_db)
    total_pdfs = len(pdfs_db)
    vector_db_size = data_processor.get_vector_db_size()
    
    # Calculate URLs and PDFs added in the last week
    one_week_ago = datetime.now() - timedelta(days=7)
    urls_last_week = sum(1 for url in urls_db if datetime.fromisoformat(url["added_date"]) > one_week_ago)
    pdfs_last_week = sum(1 for pdf in pdfs_db if datetime.fromisoformat(pdf["added_date"]) > one_week_ago)
    
    # Get the last updated time
    last_updated = datetime.now()
    if activity_db:
        last_activity = max(activity_db, key=lambda x: x["timestamp"])
        last_updated = datetime.fromisoformat(last_activity["timestamp"])
    
    # Check system status
    system_status = [
        {"name": "Vector Database", "operational": True},
        {"name": "Embedding API", "operational": bool(settings["api_keys"]["cohereApiKey"])},
        {"name": "LLM API", "operational": bool(settings["api_keys"]["groqApiKey"])},
        {"name": "Chat Interface", "operational": True}
    ]
    
    return {
        "totalUrls": total_urls,
        "totalPdfs": total_pdfs,
        "vectorDbSize": vector_db_size,
        "urlsLastWeek": urls_last_week,
        "pdfsLastWeek": pdfs_last_week,
        "lastUpdated": {
            "date": last_updated.strftime("%Y-%m-%d"),
            "time": last_updated.strftime("%H:%M:%S")
        },
        "systemStatus": system_status
    }

# Recent activity endpoint (protected)
@app.get("/activity")
async def get_activity(current_user: dict = Depends(get_current_user)):
    # Convert timestamps to "time ago" format
    result = []
    now = datetime.now()
    
    for activity in sorted(activity_db, key=lambda x: x["timestamp"], reverse=True):
        activity_time = datetime.fromisoformat(activity["timestamp"])
        delta = now - activity_time
        
        if delta.days > 0:
            time_ago = f"{delta.days} days ago"
        elif delta.seconds >= 3600:
            hours = delta.seconds // 3600
            time_ago = f"{hours} hours ago"
        elif delta.seconds >= 60:
            minutes = delta.seconds // 60
            time_ago = f"{minutes} minutes ago"
        else:
            time_ago = "Just now"
        
        result.append({
            "id": activity["id"],
            "type": activity["type"],
            "name": activity["name"],
            "timeAgo": time_ago
        })
    
    return result

# Settings endpoints (protected)
@app.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    return settings

@app.post("/settings/general")
async def update_general_settings(
    settings_data: GeneralSettings,
    current_user: dict = Depends(get_current_user)
):
    settings["general"] = settings_data.dict()
    
    # Update chatbot settings
    chatbot.update_settings(
        settings["advanced"]["llmModel"],
        settings["advanced"]["maxContext"],
        settings_data.botName,
        settings_data.greeting,
        settings_data.debugMode
    )
    
    return {"success": True}

@app.post("/settings/api-keys")
async def update_api_keys(
    api_keys: ApiKeys,
    current_user: dict = Depends(get_current_user)
):
    settings["api_keys"] = api_keys.dict()
    
    # Update the API keys in the data processor and chatbot
    data_processor.update_api_keys(api_keys.cohereApiKey)
    chatbot.update_api_keys(api_keys.groqApiKey)
    
    return {"success": True}

@app.post("/settings/advanced")
async def update_advanced_settings(
    advanced_settings: AdvancedSettings,
    current_user: dict = Depends(get_current_user)
):
    settings["advanced"] = advanced_settings.dict()
    
    # Update the advanced settings in the data processor and chatbot
    data_processor.update_settings(advanced_settings.embeddingModel, advanced_settings.maxContext)
    chatbot.update_settings(advanced_settings.llmModel, advanced_settings.maxContext)
    
    return {"success": True}

if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=10000)

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import firestore
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uuid
import json
import os
import shutil
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Import Beanie models
from models import (
    InterviewConfig, InterviewState, UserResponse, Message, COMPANY_PROFILES,
    User, Interview, UserSettings
)
from agent import interview_agent, feedback_agent, improvement_agent, should_ask_followup, FOLLOWUP_PROMPTS
from db import init_db, get_db, get_bucket
from firebase_admin import firestore
from auth import (
    UserCreate, UserLogin, Token, UserResponse as AuthUserResponse,
    create_user, authenticate_user, get_user_by_email, create_access_token,
    get_current_user, require_auth
)
from resume_parser import parse_resume, generate_resume_context
from speech_analyzer import analyze_all_responses
from jd_parser import parse_job_description, generate_jd_context
from pdf_generator import generate_pdf_report
from email_service import EmailService

app = FastAPI(title="CareerForge AI API", version="2.0.0")

# CORS Configuration
def parse_allowed_origins(raw_origins: str) -> List[str]:
    """Accept comma-separated strings or JSON arrays from env vars."""
    if not raw_origins:
        return []

    raw_origins = raw_origins.strip()
    parsed: List[str] = []

    if raw_origins.startswith("["):
        try:
            value = json.loads(raw_origins)
            if isinstance(value, list):
                parsed = [str(item).strip() for item in value]
        except json.JSONDecodeError:
            parsed = []
    else:
        parsed = [origin.strip() for origin in raw_origins.split(",")]

    # Normalize trailing slash so browser origin matching is consistent.
    return [origin.rstrip("/") for origin in parsed if origin]


origins = parse_allowed_origins(os.getenv("CORS_ALLOWED_ORIGINS", ""))
allow_origin_regex = os.getenv("CORS_ALLOWED_ORIGIN_REGEX", "").strip() or None

# Default origins if none specified
if not origins:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://career-forge-ai-beige.vercel.app",
        "https://career-forge-ai-production.up.railway.app"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for audio uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# Services
email_service = EmailService()
scheduler = AsyncIOScheduler()

async def check_reminders():
    """Background task to send reminders based on user settings."""
    print("⏰ Checking for reminders...")
    
    db = get_db()
    if not db:
        print("❌ Database not initialized, skipping reminders")
        return
        
    # Query users who have enabled email reminders
    docs = db.collection('user_settings').where('email_reminders', '==', True).stream()
    
    count = 0
    now = datetime.utcnow()
    
    for doc in docs:
        settings_data = doc.to_dict()
        user_id = settings_data.get('user_id')
        frequency = settings_data.get('reminder_frequency', 'weekly')
        last_sent = settings_data.get('last_reminder_sent')
        
        # Calculate if reminder should be sent based on frequency
        should_send = False
        if last_sent is None:
            should_send = True
        else:
            # Handle Firestore timestamp
            if hasattr(last_sent, 'timestamp'):
                last_sent = datetime.fromtimestamp(last_sent.timestamp())
            
            days_since = (now - last_sent).days
            
            if frequency == 'daily' and days_since >= 1:
                should_send = True
            elif frequency == 'weekly' and days_since >= 7:
                should_send = True
            elif frequency == 'monthly' and days_since >= 30:
                should_send = True
        
        if not should_send:
            continue
            
        # Fetch user to get email
        user_doc = db.collection('users').document(user_id).get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            email = user_data.get('email')
            full_name = user_data.get('full_name')
            
            # Send reminder
            success = await email_service.send_reminder(email, full_name)
            
            if success:
                # Update last_reminder_sent timestamp
                db.collection('user_settings').document(doc.id).update({
                    'last_reminder_sent': now
                })
                count += 1
    
    if count > 0:
        print(f"✅ Sent {count} reminders.")
    else:
        print("ℹ️ No reminders to send at this time.")

# Initialize DB and Scheduler on startup
@app.on_event("startup")
async def on_startup():
    await init_db()
    
    # Start scheduler
    scheduler.add_job(check_reminders, 'interval', hours=24) # Daily check
    scheduler.start()
    print("🚀 Scheduler started.")

# Test endpoint to trigger reminder manually
@app.post("/api/test-reminder")
async def test_reminder(user: User = Depends(require_auth)):
    await email_service.send_reminder(user.email, user.full_name)
    return {"status": "sent", "email": user.email}

# In-memory cache for active sessions (backup/fast access)
sessions: Dict[str, InterviewState] = {}


async def restore_session(session_id: str) -> Optional[InterviewState]:
    """Restore session state from database if missing in memory."""
    db = get_db()
    docs = db.collection('interviews').where('session_id', '==', session_id).stream()
    
    interview_data = None
    for doc in docs:
        interview_data = doc.to_dict()
        break
        
    if not interview_data:
        return None
    
    if not interview_data.get('config_json'):
        return None

    try:
        config = InterviewConfig(**interview_data['config_json'])
        state = InterviewState(
            interview_config=config,
            max_questions=config.max_questions
        )
        
        transcript = interview_data.get('transcript', [])
        if transcript:
            state.conversation_history = [Message(**m) for m in transcript]
            
        # Restore counters
        state.question_count = len([m for m in state.conversation_history if m.role == "model" and "?" in m.content])
        
        # Check completion
        state.is_completed = interview_data.get('score') is not None
        
        sessions[session_id] = state
        return state
    except Exception as e:
        print(f"Error restoring session: {e}")
        return None


async def save_session_state(session_id: str, state: InterviewState):
    """Persist current session state to database."""
    db = get_db()
    docs = db.collection('interviews').where('session_id', '==', session_id).stream()
    
    for doc in docs:
        db.collection('interviews').document(doc.id).update({
            'transcript': [m.model_dump() for m in state.conversation_history]
        })
        break


class StartSessionRequest(BaseModel):
    config: InterviewConfig


class JDParseRequest(BaseModel):
    job_description: str


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = await create_user(user_data)
    access_token = create_access_token(data={"sub": user.email})
    
    # Send welcome email
    await email_service.send_email(
        [user.email], 
        "Welcome to CareerForge.ai! 🚀", 
        f"<h1>Welcome {user.full_name}!</h1><p>We're excited to help you ace your next interview.</p>"
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=AuthUserResponse.from_mongo(user)
    )


@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=AuthUserResponse.from_mongo(user)
    )


@app.get("/api/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return AuthUserResponse.from_mongo(user)


@app.post("/api/resume/parse")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    resume_data = parse_resume(content)
    context = generate_resume_context(resume_data)
    
    return {
        "parsed": resume_data.model_dump(),
        "context": context
    }


@app.post("/api/jd/parse")
async def parse_jd_endpoint(req: JDParseRequest):
    parsed = parse_job_description(req.job_description)
    context = generate_jd_context(parsed)
    
    return {
        "parsed": parsed.model_dump(),
        "context": context
    }


@app.get("/api/companies")
async def get_companies():
    return {
        name: {
            "name": profile.name,
            "interview_style": profile.interview_style,
            "focus_areas": profile.focus_areas
        }
        for name, profile in COMPANY_PROFILES.items()
    }


@app.post("/api/interview/start")
async def start_interview(
    req: StartSessionRequest,
    user: Optional[User] = Depends(get_current_user)
):
    session_id = str(uuid.uuid4())
    
    # Apply user settings if available and not overridden
    if user:
        db = get_db()
        settings_refs = db.collection('user_settings').where('user_id', '==', user.id).stream()
        for ref in settings_refs:
            settings = UserSettings(**ref.to_dict())
            # If the request didn't explicitly specify timer settings (or used defaults), we could apply user settings.
            # However, since config comes from frontend, it's safer to rely on frontend sending the right values.
            # We'll trust config but maybe log or ensure consistency.
            # Actually, let's just use the config provided by the user.
            break

    config = req.config
    state = InterviewState(
        interview_config=config,
        max_questions=config.max_questions
    )
    sessions[session_id] = state
    
    interview_model = Interview(
        session_id=session_id,
        user_id=str(user.id) if user else None,
        role=config.role,
        experience_level=config.experience_level,
        topic=config.topic,
        interview_type=config.interview_type,
        interviewer_style=config.interviewer_style,
        company=config.company,
        language=config.language,
        resume_data={"context": config.resume_context} if config.resume_context else None,
        config_json=config.model_dump(),
        started_at=datetime.utcnow()
    )
    
    db = get_db()
    interview_dict = interview_model.model_dump(exclude={"id"})
    update_time, doc_ref = db.collection('interviews').add(interview_dict)
    
    response = await interview_agent.run(
        "Please start the interview by introducing yourself and asking the first question.",
        deps=config
    )
    
    state.conversation_history.append(Message(role="model", content=response.output))
    await save_session_state(session_id, state)
    
    return {
        "session_id": session_id,
        "message": response.output,
        "config": config.model_dump()
    }


@app.post("/api/interview/chat")
async def chat(req: UserResponse):
    state = sessions.get(req.session_id)
    if not state:
        state = await restore_session(req.session_id)
        if not state:
            raise HTTPException(status_code=404, detail="Session not found")
    
    if state.is_completed:
        return {"message": "Interview completed", "is_interview_ended": True}
    
    state.conversation_history.append(Message(role="user", content=req.content))
    await save_session_state(req.session_id, state)
    
    if should_ask_followup(req.content, state.follow_up_count):
        import random
        followup = random.choice(FOLLOWUP_PROMPTS)
        state.follow_up_count += 1
        
        response = await interview_agent.run(
            f"The candidate said: '{req.content}'. This answer could use more depth. Ask this follow-up: {followup}",
            deps=state.interview_config
        )
        
        state.conversation_history.append(Message(role="model", content=response.output))
        await save_session_state(req.session_id, state)
        return {"message": response.output, "is_interview_ended": False, "is_followup": True}
    
    state.question_count += 1
    state.follow_up_count = 0
    
    if state.question_count >= state.max_questions:
        response = await interview_agent.run(
            f"User response: {req.content}. This was the final question. Thank the candidate warmly and say 'Interview Concluded'.",
            deps=state.interview_config
        )
        state.is_completed = True
        state.conversation_history.append(Message(role="model", content=response.output))
        
        db = get_db()
        docs = db.collection('interviews').where('session_id', '==', req.session_id).stream()
        for doc in docs:
            doc_ref = db.collection('interviews').document(doc.id)
            doc_ref.update({
                'completed_at': datetime.utcnow(),
                'transcript': [m.model_dump() for m in state.conversation_history]
            })
            break
        
        return {"message": response.output, "is_interview_ended": True}
    
    response = await interview_agent.run(
        f"The candidate says: '{req.content}'. Acknowledge briefly then ask the next question.",
        deps=state.interview_config
    )
    
    state.conversation_history.append(Message(role="model", content=response.output))
    await save_session_state(req.session_id, state)
    
    return {
        "message": response.output,
        "is_interview_ended": False,
        "question_number": state.question_count,
        "total_questions": state.max_questions
    }


@app.post("/api/interview/{session_id}/upload-audio")
async def upload_audio(session_id: str, blob: UploadFile = File(...)):
    db = get_db()
    docs = db.collection('interviews').where('session_id', '==', session_id).stream()
    
    interview_doc = None
    for doc in docs:
        interview_doc = doc
        break

    if not interview_doc:
        raise HTTPException(status_code=404, detail="Session not found")

    bucket = get_bucket()
    if not bucket:
        raise HTTPException(status_code=500, detail="Storage bucket not initialized")
        
    filename = f"uploads/{session_id}/{datetime.now().timestamp()}.webm"
    blob_ref = bucket.blob(filename)
    
    # Upload from file-like object
    blob_ref.upload_from_file(blob.file, content_type="audio/webm")
    
    # Make public so frontend can access (or use signed URLs, using public for ease here)
    blob_ref.make_public()
    url = blob_ref.public_url
    
    interview_data = interview_doc.to_dict()
    audio_urls = interview_data.get('audio_urls', {})
    transcript = interview_data.get('transcript', [])
    current_idx = len(transcript)
    
    audio_urls[str(current_idx)] = url
    
    db.collection('interviews').document(interview_doc.id).update({
        'audio_urls': audio_urls
    })
    
    return {"status": "uploaded", "url": url}


class FeedbackRequest(BaseModel):
    session_id: str


@app.post("/api/interview/feedback")
async def get_feedback(req: FeedbackRequest):
    session_id = req.session_id
    
    # First check if feedback already exists in database
    db = get_db()
    docs = db.collection('interviews').where('session_id', '==', session_id).stream()
    
    existing_interview = None
    existing_doc_id = None
    for doc in docs:
        existing_interview = doc.to_dict()
        existing_doc_id = doc.id
        break
    
    if not existing_interview:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # If feedback already exists (score is set), return cached data
    if existing_interview.get('score') is not None:
        return {
            "score": existing_interview.get('score', 0),
            "summary": existing_interview.get('summary', ''),
            "strengths": existing_interview.get('strengths', []),
            "improvements": existing_interview.get('improvements', []),
            "communication_score": existing_interview.get('communication_score', 0),
            "technical_score": existing_interview.get('technical_score', 0),
            "problem_solving_score": existing_interview.get('problem_solving_score', 0),
            "culture_fit_score": existing_interview.get('culture_fit_score', 0),
            "improvement_tips": existing_interview.get('improvement_tips', []),
            "voice_metrics": existing_interview.get('voice_metrics'),
            "transcript": existing_interview.get('transcript', []),
            "audio_urls": existing_interview.get('audio_urls', {})
        }
    
    # No cached feedback, need to generate it
    state = sessions.get(session_id)
    if not state:
        state = await restore_session(session_id)
        if not state:
            raise HTTPException(status_code=404, detail="Session state not found")
    
    transcript = "\n".join([f"{m.role.upper()}: {m.content}" for m in state.conversation_history])
    
    user_messages = [m for m in state.conversation_history if m.role == "user"]
    user_word_count = sum(len(m.content.split()) for m in user_messages)
    
    if user_word_count < 10:
        fallback_data = {
            "score": 10,
            "summary": "The interview was too short or lacked participation.",
            "strengths": ["Attendance"],
            "improvements": ["Please provide more detailed responses."],
            "communication_score": 10,
            "technical_score": 10,
            "problem_solving_score": 10,
            "culture_fit_score": 10,
            "improvement_tips": ["Practice answering questions with the STAR method."],
            "voice_metrics": None
        }
        
        # Update DB for short interview
        db = get_db()
        docs = db.collection('interviews').where('session_id', '==', session_id).stream()
        for doc in docs:
            db.collection('interviews').document(doc.id).update(fallback_data)
            break
            
        return fallback_data
    
    voice_metrics = analyze_all_responses([m.model_dump() for m in state.conversation_history])
    
    result = await feedback_agent.run(f"Interview transcript:\n{transcript}")
    
    try:
        content = result.output
        clean_json = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        
        data["voice_metrics"] = voice_metrics.model_dump()
        
        db = get_db()
        docs = db.collection('interviews').where('session_id', '==', session_id).stream()
        
        interview_data = None
        for doc in docs:
            interview_doc = doc
            interview_data = doc.to_dict()
            
            db.collection('interviews').document(doc.id).update({
                'score': data.get("score", 0),
                'communication_score': data.get("communication_score", 0),
                'technical_score': data.get("technical_score", 0),
                'problem_solving_score': data.get("problem_solving_score", 0),
                'culture_fit_score': data.get("culture_fit_score", 0),
                'summary': data.get("summary", ""),
                'strengths': data.get("strengths", []),
                'improvements': data.get("improvements", []),
                'improvement_tips': data.get("improvement_tips", []),
                'voice_metrics': voice_metrics.model_dump()
            })
            break
            
        if not interview_data:
             raise HTTPException(status_code=404, detail="Session not found during feedback")
        
        # Add transcript and audio URLs to response
        data["transcript"] = [m.model_dump() for m in state.conversation_history]
        data["audio_urls"] = interview_data.get('audio_urls', {})
        
        return data
    except Exception as e:
        print(f"JSON Parsing Error: {e}")
        return {
            "score": 50,
            "summary": "Could not parse detailed feedback.",
            "strengths": ["Completed the interview"],
            "improvements": ["System error in report generation"],
            "communication_score": 50,
            "technical_score": 50,
            "problem_solving_score": 50,
            "culture_fit_score": 50,
            "improvement_tips": [],
            "voice_metrics": voice_metrics.model_dump()
        }


@app.post("/api/interview/export-pdf")
async def export_pdf(req: FeedbackRequest):
    db = get_db()
    docs = db.collection('interviews').where('session_id', '==', req.session_id).stream()
    
    interview_data = None
    for doc in docs:
        interview_data = doc.to_dict()
        break
        
    if not interview_data:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Create Interview object to access fields easily
    interview_model = Interview(**interview_data)
    
    pdf_bytes = generate_pdf_report(
        session_id=interview_model.session_id,
        role=interview_model.role,
        experience_level=interview_model.experience_level or "Mid-Level",
        score=interview_model.score or 0,
        summary=interview_model.summary or "No summary available",
        strengths=interview_model.strengths or [],
        improvements=interview_model.improvements or [],
        communication_score=interview_model.communication_score or 0,
        technical_score=interview_model.technical_score or 0,
        problem_solving_score=interview_model.problem_solving_score or 0,
        culture_fit_score=interview_model.culture_fit_score or 0,
        improvement_tips=interview_model.improvement_tips or [],
        transcript=interview_model.transcript or [],
        voice_metrics=interview_model.voice_metrics
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=careerforge_report_{req.session_id[:8]}.pdf"}
    )


@app.get("/api/dashboard/interviews")
async def get_user_interviews(
    user: User = Depends(require_auth),
    limit: int = 20
):
    db = get_db()
    print(f"🔍 Fetching interviews for user_id: '{user.id}'")
    
    # Simple query without order_by (avoids index issues)
    docs = db.collection('interviews')\
        .where('user_id', '==', user.id)\
        .limit(limit)\
        .stream()
        
    interviews = []
    for doc in docs:
        d = doc.to_dict()
        print(f"  📝 Found interview: {d.get('session_id', 'N/A')[:8]}...")
        interviews.append(Interview(**d))
    
    print(f"✅ Total interviews found: {len(interviews)}")
    
    # Sort in Python instead of Firestore
    interviews.sort(key=lambda x: x.started_at or datetime.min, reverse=True)
    
    return [
        {
            "session_id": i.session_id,
            "role": i.role,
            "experience_level": i.experience_level,
            "interview_type": i.interview_type,
            "company": i.company,
            "score": i.score,
            "started_at": i.started_at.isoformat() if i.started_at else None,
            "completed_at": i.completed_at.isoformat() if i.completed_at else None
        }
        for i in interviews
    ]


@app.get("/api/dashboard/stats")
async def get_user_stats(user: User = Depends(require_auth)):
    db = get_db()
    docs = db.collection('interviews').where('user_id', '==', user.id).stream()
    
    interviews = [Interview(**doc.to_dict()) for doc in docs]
    
    completed = [i for i in interviews if i.score is not None]
    
    if not completed:
        return {
            "total_interviews": len(interviews),
            "average_score": 0,
            "best_score": 0,
            "recent_trend": "neutral",
            "category_averages": {}
        }
    
    scores = [i.score for i in completed]
    
    # Sort locally for trend (if not sorted by DB)
    completed.sort(key=lambda x: x.started_at)
    
    recent = completed[-5:] if len(completed) >= 5 else completed
    if len(recent) >= 2:
        first_half_avg = sum(i.score for i in recent[:len(recent)//2]) / (len(recent)//2)
        second_half_avg = sum(i.score for i in recent[len(recent)//2:]) / (len(recent) - len(recent)//2)
        trend = "improving" if second_half_avg > first_half_avg else "declining" if second_half_avg < first_half_avg else "stable"
    else:
        trend = "neutral"
    
    return {
        "total_interviews": len(interviews),
        "completed_interviews": len(completed),
        "average_score": round(sum(scores) / len(scores), 1),
        "best_score": max(scores),
        "recent_trend": trend,
        "category_averages": {
            "communication": round(sum(i.communication_score or 0 for i in completed) / len(completed), 1),
            "technical": round(sum(i.technical_score or 0 for i in completed) / len(completed), 1),
            "problem_solving": round(sum(i.problem_solving_score or 0 for i in completed) / len(completed), 1),
            "culture_fit": round(sum(i.culture_fit_score or 0 for i in completed) / len(completed), 1)
        }
    }


@app.get("/api/settings")
async def get_settings(user: User = Depends(require_auth)):
    db = get_db()
    docs = db.collection('user_settings').where('user_id', '==', user.id).stream()
    
    settings_data = None
    settings_doc_id = None
    
    for doc in docs:
        settings_data = doc.to_dict()
        settings_doc_id = doc.id
        break
        
    if not settings_data:
        # Create default
        new_settings = UserSettings(user_id=user.id)
        settings_dict = new_settings.model_dump(exclude={"id"})
        _, ref = db.collection('user_settings').add(settings_dict)
        settings_data = settings_dict
        settings_doc_id = ref.id
    
    settings = UserSettings(**settings_data)
    settings.id = settings_doc_id
    
    return {
        "theme": settings.theme,
        "language": settings.language,
        "enable_timer": settings.enable_timer,
        "time_per_question": settings.time_per_question,
        "email_reminders": settings.email_reminders,
        "reminder_frequency": settings.reminder_frequency
    }


class UpdateSettingsRequest(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    enable_timer: Optional[bool] = None
    time_per_question: Optional[int] = None
    email_reminders: Optional[bool] = None
    reminder_frequency: Optional[str] = None


@app.put("/api/settings")
async def update_settings(
    req: UpdateSettingsRequest,
    user: User = Depends(require_auth)
):
    db = get_db()
    docs = db.collection('user_settings').where('user_id', '==', user.id).stream()
    
    doc_ref = None
    settings = None
    
    for doc in docs:
        doc_ref = db.collection('user_settings').document(doc.id)
        settings = UserSettings(**doc.to_dict())
        break
        
    if not doc_ref:
        new_settings = UserSettings(user_id=user.id)
        settings_dict = new_settings.model_dump(exclude={"id"})
        _, ref = db.collection('user_settings').add(settings_dict)
        doc_ref = db.collection('user_settings').document(ref.id)
        settings = new_settings
    
    updates = {}
    if req.theme is not None:
        updates['theme'] = req.theme
    if req.language is not None:
        updates['language'] = req.language
    if req.enable_timer is not None:
        updates['enable_timer'] = req.enable_timer
    if req.time_per_question is not None:
        updates['time_per_question'] = req.time_per_question
    if req.email_reminders is not None:
        updates['email_reminders'] = req.email_reminders
    if req.reminder_frequency is not None:
        updates['reminder_frequency'] = req.reminder_frequency
    
    if updates:
        doc_ref.update(updates)
    
    return {"status": "updated"}

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict

from datetime import datetime
import uuid


class InterviewConfig(BaseModel):
    role: str = Field(..., description="The job role being interviewed for")
    experience_level: Literal["Intern", "Junior", "Mid-Level", "Senior", "Lead"] = "Mid-Level"
    topic: Optional[str] = Field(None, description="Specific topic to focus on")
    
    interview_type: Literal["Behavioral", "Technical", "System Design", "Case Study", "Mixed"] = "Mixed"
    interviewer_style: Literal["Friendly", "Challenging", "Technical"] = "Friendly"
    company: Optional[str] = Field(None, description="Target company for tailored questions")
    language: str = Field("en", description="Interview language code")
    
    enable_timer: bool = False
    time_per_question: int = Field(120, ge=30, le=600, description="Seconds per question")
    max_questions: int = Field(5, ge=3, le=15)
    
    resume_context: Optional[str] = Field(None, description="Parsed resume data for context")
    job_description: Optional[str] = Field(None, description="Job description for tailored questions")
    
    enable_panel: bool = False


class Message(BaseModel):
    role: Literal["user", "model", "system"]
    content: str
    timestamp: Optional[str] = None


class VoiceMetrics(BaseModel):
    words_per_minute: float = 0.0
    filler_word_count: int = 0
    filler_words_list: List[str] = []
    total_words: int = 0
    confidence_score: float = 0.0
    clarity_score: float = 0.0
    pace_rating: str = "Normal"
    feedback: List[str] = []


class InterviewState(BaseModel):
    conversation_history: List[Message] = []
    interview_config: InterviewConfig
    question_count: int = 0
    max_questions: int = 5
    is_completed: bool = False
    follow_up_count: int = 0
    current_interviewer: str = "InterviewFlow"


class UserResponse(BaseModel):
    session_id: str
    content: str


class AgentResponse(BaseModel):
    content: str
    is_interview_ended: bool = False


class FeedbackStructure(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall performance score")
    summary: str = Field(..., description="Detailed executive summary")
    strengths: List[str] = Field(..., description="List of strengths")
    improvements: List[str] = Field(..., description="List of areas for improvement")
    
    communication_score: int = Field(0, ge=0, le=100)
    technical_score: int = Field(0, ge=0, le=100)
    problem_solving_score: int = Field(0, ge=0, le=100)
    culture_fit_score: int = Field(0, ge=0, le=100)
    
    improvement_tips: List[str] = Field(default_factory=list)
    recommended_resources: List[str] = Field(default_factory=list)


class CompanyProfile(BaseModel):
    name: str
    interview_style: str
    focus_areas: List[str]
    sample_questions: List[str]


# --- Database Models (Firestore) ---

class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class UserSettings(BaseModel):
    id: Optional[str] = None
    user_id: str
    
    theme: str = "dark"
    language: str = "en"
    enable_timer: bool = False
    time_per_question: int = 120
    email_reminders: bool = False
    reminder_frequency: str = "weekly"


class Interview(BaseModel):
    id: Optional[str] = None
    session_id: str
    user_id: Optional[str] = None
    
    role: str
    experience_level: Optional[str] = None
    topic: Optional[str] = None
    interview_type: str = "Mixed"
    interviewer_style: str = "Friendly"
    company: Optional[str] = None
    language: str = "en"
    
    resume_data: Optional[Dict] = None
    transcript: Optional[List[Dict]] = None
    
    score: Optional[int] = None
    communication_score: Optional[int] = None
    technical_score: Optional[int] = None
    problem_solving_score: Optional[int] = None
    culture_fit_score: Optional[int] = None
    
    summary: Optional[str] = None
    strengths: Optional[List[str]] = None
    improvements: Optional[List[str]] = None
    improvement_tips: Optional[List[str]] = None
    
    voice_metrics: Optional[Dict] = None
    
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    
    config_json: Optional[Dict] = None
    audio_urls: Optional[Dict] = None


COMPANY_PROFILES = {
    "google": CompanyProfile(
        name="Google",
        interview_style="Technical with behavioral elements",
        focus_areas=["System Design", "Algorithms", "Googleyness"],
        sample_questions=[
            "Design a URL shortener like bit.ly",
            "Tell me about a time you had to influence without authority",
            "How would you improve Google Maps?"
        ]
    ),
    "amazon": CompanyProfile(
        name="Amazon",
        interview_style="Leadership Principles focused",
        focus_areas=["Leadership Principles", "Customer Obsession", "Ownership"],
        sample_questions=[
            "Tell me about a time you disagreed with your manager",
            "Describe a situation where you had to make a decision with incomplete data",
            "How do you prioritize when everything is urgent?"
        ]
    ),
    "meta": CompanyProfile(
        name="Meta",
        interview_style="Coding and product sense",
        focus_areas=["Coding", "System Design", "Product Thinking"],
        sample_questions=[
            "Design Instagram Stories",
            "How would you improve Facebook Marketplace?",
            "Tell me about a product you built from scratch"
        ]
    ),
    "microsoft": CompanyProfile(
        name="Microsoft",
        interview_style="Technical depth with growth mindset",
        focus_areas=["Technical Skills", "Collaboration", "Growth Mindset"],
        sample_questions=[
            "Design a distributed cache",
            "Tell me about a time you failed and what you learned",
            "How do you stay updated with technology?"
        ]
    ),
    "apple": CompanyProfile(
        name="Apple",
        interview_style="Design and innovation focused",
        focus_areas=["Attention to Detail", "Innovation", "User Experience"],
        sample_questions=[
            "Why do you want to work at Apple?",
            "Describe something you designed that you're proud of",
            "How do you handle criticism of your work?"
        ]
    )
}


INTERVIEWER_PERSONAS = {
    "technical_lead": {
        "name": "Alex",
        "role": "Technical Lead",
        "style": "Deep technical questions, expects precise answers",
        "focus": "algorithms, system design, code quality"
    },
    "hr_manager": {
        "name": "Sarah",
        "role": "HR Manager",
        "style": "Warm and encouraging, focuses on cultural fit",
        "focus": "behavioral questions, values, teamwork"
    },
    "product_manager": {
        "name": "Michael",
        "role": "Product Manager",
        "style": "Strategic thinking, product sense",
        "focus": "product thinking, user empathy, prioritization"
    }
}

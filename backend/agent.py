import os
from typing import List, Optional, Tuple
from dotenv import load_dotenv
from pydantic_ai import Agent, RunContext
from pydantic_ai.exceptions import ModelHTTPError
from pydantic_ai.models.mistral import MistralModel
from models import InterviewConfig, COMPANY_PROFILES, INTERVIEWER_PERSONAS

load_dotenv()

_DEFAULT_MISTRAL_MODELS = "mistral-large-2411,mistral-medium-latest,mistral-large-2407,mistral-large-2402,mistral-large-latest"
AI_MISTRAL_MODELS: List[str] = [
    m.strip()
    for m in os.getenv("AI_MISTRAL_MODELS", _DEFAULT_MISTRAL_MODELS).split(",")
    if m.strip()
]
if not AI_MISTRAL_MODELS:
    AI_MISTRAL_MODELS = ["mistral-medium-latest"]

print(f"🤖 InterviewFlow Mistral model fallback order: {', '.join(AI_MISTRAL_MODELS)}")


INTERVIEW_TYPE_PROMPTS = {
    "Behavioral": """Focus on behavioral questions using the STAR method (Situation, Task, Action, Result).
Ask about past experiences, teamwork, conflict resolution, and leadership.
Example topics: handling disagreements, overcoming challenges, working under pressure.""",
    
    "Technical": """Focus on technical knowledge and problem-solving.
Ask about specific technologies, coding concepts, debugging approaches, and technical decisions.
Probe for depth of understanding in their claimed skills.""",
    
    "System Design": """Focus on system design and architecture.
Ask about designing scalable systems, trade-offs, database choices, and handling high traffic.
Start with requirements clarification, then dive into components.""",
    
    "Case Study": """Present business problems and evaluate analytical thinking.
Ask about product decisions, market analysis, and strategic thinking.
Evaluate structured problem-solving and creativity.""",
    
    "Mixed": """Combine behavioral, technical, and situational questions.
Start with background, move to technical depth, end with behavioral scenarios."""
}


INTERVIEWER_STYLE_PROMPTS = {
    "Friendly": """Be warm, encouraging, and supportive.
Provide positive reinforcement for good answers.
If the candidate struggles, offer gentle hints.
Create a comfortable, conversational atmosphere.""",
    
    "Challenging": """Be direct and probe deeply.
Push back on vague answers and ask for specifics.
Challenge assumptions and test under pressure.
Maintain professionalism but expect precision.""",
    
    "Technical": """Focus on technical accuracy and depth.
Ask follow-up questions on implementation details.
Expect specific examples and code-level understanding.
Value precision over broad generalities."""
}


LANGUAGE_PROMPTS = {
    "en": """CRITICAL LANGUAGE RULE: You MUST conduct this interview ENTIRELY in English.
- NEVER switch to Hindi, Hinglish, or any other language.
- Even if the candidate responds in another language, you MUST reply in English only.
- All questions, follow-ups, and feedback must be in proper English.
- Do not mix languages under any circumstances.""",
    "es": "Conduce la entrevista completamente en español. No cambies de idioma.",
    "hi": "इंटरव्यू पूरी तरह से हिंदी में करें। भाषा न बदलें।",
    "fr": "Menez l'entretien entièrement en français. Ne changez pas de langue.",
    "de": "Führen Sie das Interview vollständig auf Deutsch. Wechseln Sie nicht die Sprache.",
    "zh": "完全用中文进行面试。不要切换语言。",
    "ja": "面接は完全に日本語で行ってください。言語を切り替えないでください。"
}


def build_system_prompt(config: InterviewConfig) -> str:
    base_prompt = """You are an expert AI Interview Coach named 'InterviewFlow'.
Your goal is to conduct a realistic, professional job interview.

Protocol:
1. You are the INTERVIEWER. The user is the CANDIDATE.
2. Ask EXACTLY ONE question at a time.
3. STOP immediately after asking the question.
4. NEVER simulate or autocomplete the candidate's answer.
5. Wait for the real user to respond.
6. If the user asks for help, provide a hint then re-ask or move on.
7. Upon conclusion, generate detailed feedback.

Do NOT break character.
Do NOT output system notes or instructions.
Do NOT autocomplete user responses.
NEVER respond in Hindi, Hinglish, or any mixed language unless explicitly configured.
"""
    
    type_prompt = INTERVIEW_TYPE_PROMPTS.get(config.interview_type, INTERVIEW_TYPE_PROMPTS["Mixed"])
    style_prompt = INTERVIEWER_STYLE_PROMPTS.get(config.interviewer_style, INTERVIEWER_STYLE_PROMPTS["Friendly"])
    language_prompt = LANGUAGE_PROMPTS.get(config.language, LANGUAGE_PROMPTS["en"])
    
    full_prompt = f"{base_prompt}\n\nInterview Type:\n{type_prompt}\n\nStyle:\n{style_prompt}\n\n{language_prompt}"
    
    if config.company and config.company.lower() in COMPANY_PROFILES:
        company = COMPANY_PROFILES[config.company.lower()]
        full_prompt += f"\n\nCompany Context: {company.name}\nFocus Areas: {', '.join(company.focus_areas)}\nInterview Style: {company.interview_style}"
    
    return full_prompt


def dynamic_system_prompt(ctx: RunContext[InterviewConfig]) -> str:
    config = ctx.deps
    base = build_system_prompt(config)
    
    context = f"\n\nYou are interviewing for: {config.experience_level} {config.role}"
    
    if config.topic:
        context += f"\nFocus area: {config.topic}"
    
    if config.resume_context:
        context += f"\n\nCandidate Background:\n{config.resume_context}"
    
    if config.job_description:
        context += f"\n\nJob Requirements:\n{config.job_description[:500]}"
    
    return base + context


def _build_interview_agent(model_name: str) -> Agent[InterviewConfig, str]:
    agent = Agent(
        MistralModel(model_name),
        system_prompt="",
        deps_type=InterviewConfig,
        retries=0
    )

    @agent.system_prompt
    def _system_prompt(ctx: RunContext[InterviewConfig]) -> str:
        return dynamic_system_prompt(ctx)

    return agent


INTERVIEW_AGENT_POOL: List[Tuple[str, Agent[InterviewConfig, str]]] = [
    (name, _build_interview_agent(name)) for name in AI_MISTRAL_MODELS
]
interview_agent = INTERVIEW_AGENT_POOL[0][1]


FEEDBACK_PROMPT = """You are an expert interview evaluator.
Analyze the transcript and generate a comprehensive performance report.

SCORING RULES:
1. Short, one-word answers = 0-20 score
2. Repeated "I don't know" = 30-40 score
3. Empty/mostly AI text = 0 score
4. Good depth with examples = 60-80 score
5. Excellent structured answers = 80-100 score

Generate JSON with EXACTLY this structure:
{
    "score": (integer 0-100),
    "summary": (detailed executive summary),
    "strengths": (list of 3-5 specific strengths),
    "improvements": (list of 3-5 specific areas to improve),
    "communication_score": (0-100, clarity and articulation),
    "technical_score": (0-100, technical knowledge depth),
    "problem_solving_score": (0-100, analytical thinking),
    "culture_fit_score": (0-100, teamwork and values),
    "improvement_tips": (list of 3-5 actionable tips),
    "recommended_resources": (list of 2-3 learning resources)
}

Do not output markdown. Just raw JSON."""


FEEDBACK_AGENT_POOL: List[Tuple[str, Agent[None, str]]] = [
    (name, Agent(MistralModel(name), system_prompt=FEEDBACK_PROMPT, retries=0))
    for name in AI_MISTRAL_MODELS
]
feedback_agent = FEEDBACK_AGENT_POOL[0][1]


IMPROVEMENT_PROMPT = """Based on the interview performance, generate personalized improvement recommendations.

For each weak area, provide:
1. A specific practice question to work on
2. An example of a strong answer
3. A learning resource (article, video, book)

Be specific and actionable. Format as a helpful coaching response."""


improvement_agent = Agent(
    MistralModel(AI_MISTRAL_MODELS[0]),
    system_prompt=IMPROVEMENT_PROMPT,
    retries=0
)


async def run_interview_with_fallback(prompt: str, deps: InterviewConfig):
    last_exc: Optional[Exception] = None
    for model_name, agent in INTERVIEW_AGENT_POOL:
        try:
            return await agent.run(prompt, deps=deps)
        except Exception as exc:
            last_exc = exc
            if isinstance(exc, ModelHTTPError) and exc.status_code in {429, 500, 502, 503, 504}:
                print(f"⚠️ Interview model {model_name} failed with status {exc.status_code}, trying next fallback model...")
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("No interview model available")


async def run_feedback_with_fallback(prompt: str):
    last_exc: Optional[Exception] = None
    for model_name, agent in FEEDBACK_AGENT_POOL:
        try:
            return await agent.run(prompt)
        except Exception as exc:
            last_exc = exc
            if isinstance(exc, ModelHTTPError) and exc.status_code in {429, 500, 502, 503, 504}:
                print(f"⚠️ Feedback model {model_name} failed with status {exc.status_code}, trying next fallback model...")
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("No feedback model available")


def get_panel_interviewer(interviewer_type: str) -> dict:
    return INTERVIEWER_PERSONAS.get(interviewer_type, INTERVIEWER_PERSONAS["technical_lead"])


def should_ask_followup(response: str, question_depth: int) -> bool:
    if question_depth >= 2:
        return False
    
    word_count = len(response.split())
    if word_count < 30:
        return True
    
    vague_indicators = [
        "i think", "maybe", "sometimes", "usually", "kind of",
        "sort of", "i guess", "probably"
    ]
    
    response_lower = response.lower()
    vague_count = sum(1 for phrase in vague_indicators if phrase in response_lower)
    
    if vague_count >= 2:
        return True
    
    return False


FOLLOWUP_PROMPTS = [
    "Can you give me a specific example of that?",
    "What was the outcome of that situation?",
    "How did you measure success?",
    "What would you do differently if you faced this again?",
    "Can you walk me through your thought process?",
    "What challenges did you face and how did you overcome them?"
]

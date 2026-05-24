import asyncio
import os
import tempfile
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.question import Question
from app.models.answer import Answer
from app.auth.security import require_admin
from app.config import settings
from app.schemas.answer import AnswerRead

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Schemas ──────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_questions: int
    total_answers: int
    new_users_today: int
    new_questions_today: int


class AdminUserRow(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    email: str
    display_name: str
    reputation: int
    is_active: bool
    is_verified: bool
    is_admin: bool
    is_lone_soldier: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    is_active: bool | None = None
    is_admin: bool | None = None
    is_verified: bool | None = None


class AdminQuestionRow(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    title: str
    author_id: int
    author_name: str
    vote_score: int
    answer_count: int
    view_count: int
    is_closed: bool
    created_at: datetime


class AdminAnswerRow(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    body_preview: str
    author_id: int
    author_name: str
    question_id: int
    question_title: str
    vote_score: int
    is_accepted: bool
    created_at: datetime


# ── Stats ─────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_questions = (await db.execute(select(func.count(Question.id)))).scalar_one()
    total_answers = (await db.execute(select(func.count(Answer.id)))).scalar_one()
    new_users_today = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= today)
    )).scalar_one()
    new_questions_today = (await db.execute(
        select(func.count(Question.id)).where(Question.created_at >= today)
    )).scalar_one()
    return AdminStats(
        total_users=total_users,
        total_questions=total_questions,
        total_answers=total_answers,
        new_users_today=new_users_today,
        new_questions_today=new_questions_today,
    )


# ── Users ─────────────────────────────────────────────────────────

@router.get("/users", response_model=dict)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(User).order_by(User.created_at.desc())
    if q:
        stmt = stmt.where(
            User.display_name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%")
        )
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset((page - 1) * per_page).limit(per_page))).scalars().all()
    return {
        "items": [AdminUserRow.model_validate(u).model_dump() for u in rows],
        "total": total, "page": page, "per_page": per_page,
    }


@router.patch("/users/{user_id}", response_model=AdminUserRow)
async def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin account")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.is_admin is not None:
        user.is_admin = data.is_admin
    if data.is_verified is not None:
        user.is_verified = data.is_verified
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()


# ── Questions ─────────────────────────────────────────────────────

@router.get("/questions", response_model=dict)
async def list_all_questions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = (
        select(Question)
        .options(selectinload(Question.author))
        .order_by(Question.created_at.desc())
    )
    if q:
        stmt = stmt.where(Question.title.ilike(f"%{q}%"))
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset((page - 1) * per_page).limit(per_page))).scalars().all()
    items = [
        AdminQuestionRow(
            id=qn.id, title=qn.title,
            author_id=qn.author_id, author_name=qn.author.display_name,
            vote_score=qn.vote_score, answer_count=qn.answer_count,
            view_count=qn.view_count, is_closed=qn.is_closed,
            created_at=qn.created_at,
        ).model_dump()
        for qn in rows
    ]
    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.delete("/questions/{question_id}", status_code=204)
async def admin_delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = (await db.execute(select(Question).where(Question.id == question_id))).scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(q)
    await db.commit()


# ── Answers ───────────────────────────────────────────────────────

@router.get("/answers", response_model=dict)
async def list_all_answers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = (
        select(Answer)
        .options(selectinload(Answer.author), selectinload(Answer.question))
        .order_by(Answer.created_at.desc())
    )
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset((page - 1) * per_page).limit(per_page))).scalars().all()
    items = [
        AdminAnswerRow(
            id=a.id,
            body_preview=a.body[:120] + ("…" if len(a.body) > 120 else ""),
            author_id=a.author_id, author_name=a.author.display_name,
            question_id=a.question_id, question_title=a.question.title,
            vote_score=a.vote_score, is_accepted=a.is_accepted,
            created_at=a.created_at,
        ).model_dump()
        for a in rows
    ]
    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.delete("/answers/{answer_id}", status_code=204)
async def admin_delete_answer(
    answer_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    a = (await db.execute(select(Answer).where(Answer.id == answer_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    # keep question answer_count in sync
    q = (await db.execute(select(Question).where(Question.id == a.question_id))).scalar_one_or_none()
    if q and q.answer_count > 0:
        q.answer_count -= 1
    await db.delete(a)
    await db.commit()


# ── AI Answer Generation ──────────────────────────────────────────

class AIGenerateResponse(BaseModel):
    generated_text: str
    citations: list[dict] = []


class AIPublishRequest(BaseModel):
    body: str


class AIFileResponse(BaseModel):
    name: str
    status: str


@router.post("/questions/{question_id}/generate-ai-answer",
             response_model=AIGenerateResponse)
async def generate_ai_answer(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Generate (but do not save) a Pinecone-grounded AI answer for a question."""
    if not settings.pinecone_api_key:
        raise HTTPException(status_code=503, detail="PINECONE_API_KEY is not configured")

    q = (await db.execute(
        select(Question).where(Question.id == question_id)
    )).scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    from app.services.pinecone_client import get_assistant

    assistant = await get_assistant()
    prompt = f"**Question:** {q.title}\n\n{q.body}"

    try:
        response = await asyncio.to_thread(
            assistant.chat,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Pinecone Assistant error: {exc}")

    text = response.message.content
    citations = []
    for ref in (response.citations or []):
        try:
            citations.append({
                "file": ref.file.name,
                "pages": [p.page_number for p in (ref.pages or [])],
            })
        except Exception:
            pass

    return AIGenerateResponse(generated_text=text, citations=citations)


@router.post("/questions/{question_id}/publish-ai-answer",
             response_model=AnswerRead, status_code=201)
async def publish_ai_answer(
    question_id: int,
    data: AIPublishRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Save the admin-reviewed AI answer to the database under the OlimAI bot user."""
    from app.config import AI_BOT_EMAIL

    q = (await db.execute(
        select(Question).where(Question.id == question_id)
    )).scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    bot = (await db.execute(
        select(User).where(User.email == AI_BOT_EMAIL)
    )).scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=500, detail="OlimAI bot user not found — check startup logs")

    answer = Answer(
        body=data.body,
        author_id=bot.id,
        question_id=question_id,
        is_ai_generated=True,
    )
    db.add(answer)
    q.answer_count += 1
    await db.commit()

    result = await db.execute(
        select(Answer)
        .options(selectinload(Answer.author), selectinload(Answer.votes))
        .where(Answer.id == answer.id)
    )
    a = result.scalar_one()
    return AnswerRead.model_validate(a).model_copy(update={"user_vote": None})


@router.post("/ai/upload-document", response_model=AIFileResponse)
async def upload_ai_document(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
):
    """Upload a document (PDF/TXT/MD/DOCX) to the Pinecone Assistant for grounding."""
    if not settings.pinecone_api_key:
        raise HTTPException(status_code=503, detail="PINECONE_API_KEY is not configured")

    allowed = {".pdf", ".txt", ".md", ".docx"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(allowed))}",
        )

    from app.services.pinecone_client import get_assistant

    contents = await file.read()
    assistant = await get_assistant()

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        uploaded = await asyncio.to_thread(
            assistant.upload_file,
            file_path=tmp_path,
            timeout=None,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Pinecone upload failed: {exc}")
    finally:
        os.unlink(tmp_path)

    uploaded_name = getattr(uploaded, "name", None) or file.filename or "unknown"
    return AIFileResponse(name=uploaded_name, status="uploaded")

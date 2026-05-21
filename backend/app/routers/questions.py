from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, update
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.question import Question, Tag
from app.models.vote import Vote
from app.schemas.question import (
    QuestionCreate, QuestionRead, QuestionUpdate,
    QuestionList, PaginatedQuestions,
)
from app.auth.security import get_current_user, get_current_user_optional
from app.services.cache import (
    cache_get, cache_set, invalidate_questions_cache, questions_cache_key,
    QUESTIONS_TTL,
)

router = APIRouter(prefix="/api/questions", tags=["questions"])

_Q_OPTS = [
    selectinload(Question.author),
    selectinload(Question.tags),
    selectinload(Question.votes),
]


async def _get_or_create_tags(db: AsyncSession, tag_names: list[str]) -> list[Tag]:
    tags = []
    for name in tag_names:
        name = name.lower().strip()
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        tags.append(tag)
    return tags


def _to_question_list(q: Question, user_id: int | None) -> QuestionList:
    user_vote = next((v.value for v in q.votes if v.user_id == user_id), None) if user_id else None
    return QuestionList.model_validate(q).model_copy(update={"user_vote": user_vote})


def _to_question_read(q: Question, user_id: int | None) -> QuestionRead:
    user_vote = next((v.value for v in q.votes if v.user_id == user_id), None) if user_id else None
    return QuestionRead.model_validate(q).model_copy(update={"user_vote": user_vote})


@router.get("", response_model=PaginatedQuestions)
async def list_questions(
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=50),
    sort: str = Query("newest", pattern="^(newest|votes|unanswered)$"),
    tag: str | None = None,
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else None

    # Serve anonymous list requests from Redis cache
    if not user_id:
        ck = questions_cache_key(page, sort, tag, q)
        cached = await cache_get(ck)
        if cached:
            return cached

    stmt = select(Question).options(*_Q_OPTS)
    if tag:
        stmt = stmt.join(Question.tags).where(Tag.name == tag.lower())
    if q:
        stmt = stmt.where(or_(Question.title.ilike(f"%{q}%"), Question.body.ilike(f"%{q}%")))
    if sort == "newest":
        stmt = stmt.order_by(Question.created_at.desc())
    elif sort == "votes":
        stmt = stmt.order_by(Question.vote_score.desc())
    elif sort == "unanswered":
        stmt = stmt.where(Question.answer_count == 0).order_by(Question.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset((page - 1) * per_page).limit(per_page))).scalars().all()

    result = PaginatedQuestions(
        items=[_to_question_list(row, user_id) for row in rows],
        total=total,
        page=page,
        per_page=per_page,
    )

    if not user_id:
        await cache_set(questions_cache_key(page, sort, tag, q), result.model_dump(), QUESTIONS_TTL)

    return result


@router.post("", response_model=QuestionRead, status_code=201)
async def create_question(
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tags = await _get_or_create_tags(db, data.tags)
    question = Question(title=data.title, body=data.body, author_id=current_user.id, tags=tags)
    db.add(question)
    await db.commit()
    await invalidate_questions_cache()
    result = await db.execute(select(Question).options(*_Q_OPTS).where(Question.id == question.id))
    return _to_question_read(result.scalar_one(), current_user.id)


@router.get("/{question_id}", response_model=QuestionRead)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    result = await db.execute(select(Question).options(*_Q_OPTS).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.execute(update(Question).where(Question.id == question_id).values(view_count=q.view_count + 1))
    await db.commit()
    result2 = await db.execute(select(Question).options(*_Q_OPTS).where(Question.id == question_id))
    q = result2.scalar_one()
    return _to_question_read(q, current_user.id if current_user else None)


@router.put("/{question_id}", response_model=QuestionRead)
async def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    if q.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if data.title is not None:
        q.title = data.title
    if data.body is not None:
        q.body = data.body
    if data.tags is not None:
        q.tags = await _get_or_create_tags(db, data.tags)
    await db.commit()
    await invalidate_questions_cache()
    result2 = await db.execute(select(Question).options(*_Q_OPTS).where(Question.id == q.id))
    return _to_question_read(result2.scalar_one(), current_user.id)


@router.delete("/{question_id}", status_code=204)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    if q.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.delete(q)
    await db.commit()
    await invalidate_questions_cache()


@router.post("/{question_id}/vote")
async def vote_question(
    question_id: int,
    value: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if value not in (1, -1, 0):
        raise HTTPException(status_code=400, detail="Vote value must be 1, -1, or 0")
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    if q.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own question")

    existing = (await db.execute(
        select(Vote).where(Vote.user_id == current_user.id, Vote.question_id == question_id)
    )).scalar_one_or_none()

    if value == 0:
        if existing:
            q.vote_score -= existing.value
            await db.delete(existing)
    elif existing:
        q.vote_score += (value - existing.value)
        existing.value = value
    else:
        db.add(Vote(user_id=current_user.id, question_id=question_id, value=value))
        q.vote_score += value

    await db.commit()
    await invalidate_questions_cache()
    return {"vote_score": q.vote_score, "user_vote": value if value != 0 else None}

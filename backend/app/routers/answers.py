from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.question import Question
from app.models.answer import Answer
from app.models.vote import Vote
from app.schemas.answer import AnswerCreate, AnswerRead, AnswerUpdate
from app.auth.security import get_current_user, get_current_user_optional
from app.services.email import send_answer_notification

router = APIRouter(prefix="/api/questions/{question_id}/answers", tags=["answers"])

_A_OPTS = [selectinload(Answer.author), selectinload(Answer.votes)]


def _to_answer_read(a: Answer, user_id: int | None) -> AnswerRead:
    user_vote = next((v.value for v in a.votes if v.user_id == user_id), None) if user_id else None
    return AnswerRead.model_validate(a).model_copy(update={"user_vote": user_vote})


@router.get("", response_model=list[AnswerRead])
async def list_answers(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    result = await db.execute(
        select(Answer).options(*_A_OPTS)
        .where(Answer.question_id == question_id)
        .order_by(Answer.is_accepted.desc(), Answer.vote_score.desc(), Answer.created_at.asc())
    )
    user_id = current_user.id if current_user else None
    return [_to_answer_read(a, user_id) for a in result.scalars().all()]


@router.post("", response_model=AnswerRead, status_code=201)
async def create_answer(
    question_id: int,
    data: AnswerCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (await db.execute(
        select(Question).options(selectinload(Question.author)).where(Question.id == question_id)
    )).scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    answer = Answer(body=data.body, author_id=current_user.id, question_id=question_id)
    db.add(answer)
    q.answer_count += 1
    await db.commit()

    # Notify question author — skip if they answered their own question
    if q.author_id != current_user.id:
        background_tasks.add_task(
            send_answer_notification,
            q.author.email,
            q.author.display_name,
            q.title,
            q.id,
            current_user.display_name,
        )

    result = await db.execute(select(Answer).options(*_A_OPTS).where(Answer.id == answer.id))
    return _to_answer_read(result.scalar_one(), current_user.id)


@router.put("/{answer_id}", response_model=AnswerRead)
async def update_answer(
    question_id: int,
    answer_id: int,
    data: AnswerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = (await db.execute(
        select(Answer).where(Answer.id == answer_id, Answer.question_id == question_id)
    )).scalar_one_or_none()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    answer.body = data.body
    await db.commit()
    result = await db.execute(select(Answer).options(*_A_OPTS).where(Answer.id == answer.id))
    return _to_answer_read(result.scalar_one(), current_user.id)


@router.delete("/{answer_id}", status_code=204)
async def delete_answer(
    question_id: int,
    answer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = (await db.execute(
        select(Answer).where(Answer.id == answer_id, Answer.question_id == question_id)
    )).scalar_one_or_none()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    q = (await db.execute(select(Question).where(Question.id == question_id))).scalar_one_or_none()
    if q and q.answer_count > 0:
        q.answer_count -= 1
    await db.delete(answer)
    await db.commit()


@router.post("/{answer_id}/vote")
async def vote_answer(
    question_id: int,
    answer_id: int,
    value: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if value not in (1, -1, 0):
        raise HTTPException(status_code=400, detail="Vote value must be 1, -1, or 0")
    answer = (await db.execute(
        select(Answer).where(Answer.id == answer_id, Answer.question_id == question_id)
    )).scalar_one_or_none()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own answer")

    existing = (await db.execute(
        select(Vote).where(Vote.user_id == current_user.id, Vote.answer_id == answer_id)
    )).scalar_one_or_none()

    if value == 0:
        if existing:
            answer.vote_score -= existing.value
            await db.delete(existing)
    elif existing:
        answer.vote_score += (value - existing.value)
        existing.value = value
    else:
        db.add(Vote(user_id=current_user.id, answer_id=answer_id, value=value))
        answer.vote_score += value

    await db.commit()
    return {"vote_score": answer.vote_score, "user_vote": value if value != 0 else None}


@router.post("/{answer_id}/accept")
async def accept_answer(
    question_id: int,
    answer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (await db.execute(select(Question).where(Question.id == question_id))).scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    if q.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the question author can accept answers")
    if q.accepted_answer_id:
        prev = (await db.execute(select(Answer).where(Answer.id == q.accepted_answer_id))).scalar_one_or_none()
        if prev:
            prev.is_accepted = False
    answer = (await db.execute(
        select(Answer).where(Answer.id == answer_id, Answer.question_id == question_id)
    )).scalar_one_or_none()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    answer.is_accepted = True
    q.accepted_answer_id = answer_id
    await db.commit()
    return {"accepted": True}

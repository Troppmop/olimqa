from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentRead
from app.auth.security import get_current_user

router = APIRouter(tags=["comments"])


@router.post("/api/questions/{question_id}/comments", response_model=CommentRead, status_code=201)
async def add_question_comment(
    question_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = Comment(body=data.body, author_id=current_user.id, question_id=question_id)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    result = await db.execute(select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment.id))
    return result.scalar_one()


@router.get("/api/questions/{question_id}/comments", response_model=list[CommentRead])
async def list_question_comments(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment).options(selectinload(Comment.author))
        .where(Comment.question_id == question_id)
        .order_by(Comment.created_at.asc())
    )
    return result.scalars().all()


@router.post("/api/answers/{answer_id}/comments", response_model=CommentRead, status_code=201)
async def add_answer_comment(
    answer_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = Comment(body=data.body, author_id=current_user.id, answer_id=answer_id)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    result = await db.execute(select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment.id))
    return result.scalar_one()


@router.delete("/api/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.delete(comment)
    await db.commit()

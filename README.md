# OlimQ&A

A Stack Overflow–style Q&A platform for **Olim Chadashim** (new immigrants to Israel) and **Lone Soldiers**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Python 3.12 + FastAPI + Pydantic v2 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Infra | Docker Compose |

## Features

- Ask, answer, and search questions
- Upvote / downvote questions and answers
- Accept answers (question author)
- Tags with color coding (pre-seeded with olim-relevant topics)
- Lone Soldier badge on profiles
- Aliyah year & country of origin fields
- Markdown editor with live preview
- JWT authentication with refresh tokens
- Fully paginated question list with sort by Newest / Most Voted / Unanswered

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Run

```bash
# Clone / enter the directory
cd question

# Copy env file (already included with defaults)
# Edit .env if you want to change passwords

# Start everything
docker compose up --build

# Frontend → http://localhost:5173
# Backend API → http://localhost:8000
# API Docs (Swagger) → http://localhost:8000/docs
```

### Stop

```bash
docker compose down
# To also remove database data:
docker compose down -v
```

## Project Structure

```
question/
├── docker-compose.yml
├── .env                        # environment variables
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app + lifespan + CORS
│       ├── config.py           # Pydantic settings
│       ├── database.py         # SQLAlchemy async engine
│       ├── models/             # SQLAlchemy ORM models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── routers/            # FastAPI route handlers
│       ├── auth/               # JWT security helpers
│       └── services/           # Redis client
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── api/                # Axios API calls
        ├── components/         # Reusable UI components
        ├── context/            # React context (Auth)
        ├── pages/              # Route-level page components
        └── types/              # TypeScript interfaces
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login → JWT tokens |
| GET | `/api/auth/me` | Current user |
| GET | `/api/questions` | List questions (paginated, filterable) |
| POST | `/api/questions` | Create question |
| GET | `/api/questions/{id}` | Get question |
| PUT | `/api/questions/{id}` | Edit question |
| DELETE | `/api/questions/{id}` | Delete question |
| POST | `/api/questions/{id}/vote` | Vote on question |
| GET | `/api/questions/{id}/answers` | List answers |
| POST | `/api/questions/{id}/answers` | Post answer |
| POST | `/api/questions/{id}/answers/{aid}/vote` | Vote on answer |
| POST | `/api/questions/{id}/answers/{aid}/accept` | Accept answer |
| GET | `/api/tags` | List all tags |
| GET | `/api/users/{id}` | User profile |

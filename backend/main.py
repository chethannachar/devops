import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

import bcrypt
import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

ROOT_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV_FILE)

INIT_DB_SQL = Path(__file__).with_name("init_db.sql")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")


def connect_to_database():
    missing_settings = [
        name
        for name, value in (
            ("DB_NAME", DB_NAME),
            ("DB_USER", DB_USER),
            ("DB_PASSWORD", DB_PASSWORD),
        )
        if not value
    ]
    if missing_settings:
        raise RuntimeError(
            "Missing database settings in the project root .env: "
            + ", ".join(missing_settings)
        )
    return psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


def initialize_database() -> None:
    with connect_to_database() as connection:
        connection.execute(INIT_DB_SQL.read_text(encoding="utf-8"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="DevOps Practice User API", lifespan=lifespan)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://devops-gamma-hazel.vercel.app"    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class UserRegistration(BaseModel):
    username: Annotated[str, Field(min_length=1, max_length=100)]
    password: Annotated[str, Field(min_length=1)]
    place_of_birth: str = ""

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes when UTF-8 encoded.")
        return password


class UserResponse(BaseModel):
    username: str
    place_of_birth: str | None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/users", response_model=UserResponse, status_code=201)
def register_user(user: UserRegistration) -> UserResponse:
    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    try:
        with connect_to_database() as connection:
            row = connection.execute(
                """
                INSERT INTO users (username, place_of_birth, password_hash)
                VALUES (%s, %s, %s)
                RETURNING username, place_of_birth
                """,
                (user.username, user.place_of_birth, hashed_password),
            ).fetchone()
    except psycopg.errors.UniqueViolation as error:
        raise HTTPException(
            status_code=409, detail="A user with that username already exists."
        ) from error

    return UserResponse(username=row[0], place_of_birth=row[1])


@app.get("/users/{username}", response_model=UserResponse)
def get_user(username: str) -> UserResponse:
    with connect_to_database() as connection:
        row = connection.execute(
            "SELECT username, place_of_birt FROM users WHERE username = %s",
            (username,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserResponse(username=row[0], place_of_birth=row[1])

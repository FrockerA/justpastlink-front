from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: str | None = None


class AuthResponse(Token):
    user: UserResponse

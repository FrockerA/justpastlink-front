from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import Token, UserLogin
from app.schemas.user import UserCreate
from fastapi import HTTPException, status

class AuthService:
    def __init__(self, db: Session):
        self.user_repository = UserRepository(db)

    def register_user(self, user_in: UserCreate) -> User:
        existing_user = self.user_repository.get_by_email(user_in.email)
        if existing_user:
            raise ValueError("User with this email already exists")

        if user_in.username:
            existing_username = self.user_repository.get_by_username(user_in.username)
            if existing_username:
                raise ValueError("User with this username already exists")

        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            is_active=True,
        )
        return self.user_repository.create(user)

    def login_user(self, credentials: UserLogin) -> Token:
        user = self.user_repository.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise ValueError("Incorrect email or password")

        if not user.is_active:
            raise ValueError("Inactive user")

        access_token = create_access_token(subject=str(user.id))
        return Token(access_token=access_token)

    def validate_password(password: str) -> None:
        if len(password.encode("utf-8")) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at most 72 bytes in UTF-8."
        )
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_password_hash,
    validate_password_length,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, UserLogin
from app.schemas.user import UserCreate, UserEmailUpdate, UserPasswordUpdate, UserUpdate


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

        validate_password_length(user_in.password)

        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            is_active=True,
        )
        return self.user_repository.create(user)

    def login_user(self, credentials: UserLogin) -> AuthResponse:
        user = self.user_repository.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise ValueError("Incorrect email or password")

        if not user.is_active:
            raise ValueError("Inactive user")

        access_token = create_access_token(subject=str(user.id))
        return AuthResponse(access_token=access_token, user=user)

    def update_user(self, user: User, user_in: UserUpdate) -> User:
        data = user_in.model_dump(exclude_unset=True)

        if "username" in data:
            username = data["username"] or None
            if username:
                existing_username = self.user_repository.get_by_username(username)
                if existing_username and existing_username.id != user.id:
                    raise ValueError("User with this username already exists")
            user.username = username

        return self.user_repository.update(user)

    def update_email(self, user: User, email_in: UserEmailUpdate) -> User:
        if not verify_password(email_in.current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")

        new_email = str(email_in.email)
        existing_user = self.user_repository.get_by_email(new_email)
        if existing_user and existing_user.id != user.id:
            raise ValueError("User with this email already exists")

        user.email = new_email
        return self.user_repository.update(user)

    def update_password(self, user: User, password_in: UserPasswordUpdate) -> User:
        if not verify_password(password_in.current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")

        validate_password_length(password_in.new_password)
        user.hashed_password = get_password_hash(password_in.new_password)
        return self.user_repository.update(user)

from datetime import datetime

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    # DB column is `username`, but frontend uses `full_name`.
    # Accept both input keys and serialize as `full_name`.
    username: str | None = Field(
        default=None,
        validation_alias=AliasChoices("username", "full_name"),
        serialization_alias="full_name",
    )


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=64)


class UserUpdate(BaseModel):
    username: str | None = Field(
        default=None,
        validation_alias=AliasChoices("username", "full_name"),
        serialization_alias="full_name",
        max_length=100,
    )


class UserEmailUpdate(BaseModel):
    email: EmailStr
    current_password: str = Field(min_length=8, max_length=64)


class UserPasswordUpdate(BaseModel):
    current_password: str = Field(min_length=8, max_length=64)
    new_password: str = Field(min_length=8, max_length=64)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime

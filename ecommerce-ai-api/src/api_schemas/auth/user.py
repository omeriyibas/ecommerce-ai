from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from api_schemas.auth.token import TokenResult
from enums.auth import UserRole

PASSWORD_MAX = 128
PASSWORD_MIN_CREATE = 8
NAME_MIN = 2
NAME_MAX = 255


class UserWithEmail(BaseModel):
    """Login — mevcut kısa şifreleri kırmamak için min 1."""

    email: EmailStr
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX)
    #: Panel: False → session refresh cookie (sekme kapanınca biter)
    remember_me: bool = True

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserCreate(BaseModel):
    name: str = Field(..., min_length=NAME_MIN, max_length=NAME_MAX)
    email: EmailStr
    password: str = Field(..., min_length=PASSWORD_MIN_CREATE, max_length=PASSWORD_MAX)
    role: UserRole | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class LoginUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class UserResult(BaseModel):
    user: UserResponse
    token: TokenResult


class LoginResult(BaseModel):
    user: LoginUserResponse
    token: TokenResult


class RegisterResponse(UserResult):
    pass


class LoginResponse(LoginResult):
    pass


class UserCleanupResponse(BaseModel):
    """Toplu panel kullanıcı temizleme sonucu."""

    users_deleted: int
    message: str = "Kullanıcılar temizlendi"

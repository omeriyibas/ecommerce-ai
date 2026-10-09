from pydantic import BaseModel


class Token(BaseModel):
    #: Mobile body; panel HttpOnly cookie kullanır (opsiyonel)
    refresh_token: str | None = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    # token_type: str = "bearer"


class TokenResult(TokenPair):
    # token_type: str
    token_type: str = "bearer"


class LogoutResponse(BaseModel):
    message: str
    revoked_sessions: int | None = None

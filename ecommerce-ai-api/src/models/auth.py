from sqlalchemy import Boolean, Column, Enum, Integer, String

from core.database import Base
from enums.auth import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.admin)
    is_active = Column(Boolean, nullable=False, default=True)

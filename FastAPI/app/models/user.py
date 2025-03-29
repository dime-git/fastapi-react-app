from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    """Base user data model"""
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    
class User(UserBase):
    """Complete user model with authentication details"""
    uid: str
    email_verified: bool = False
    
class UserPreferences(BaseModel):
    """User preferences model"""
    default_currency: str = "USD"
    theme: str = "light"
    
class UserCreate(UserBase):
    """Model for creating a new user"""
    password: str = Field(..., min_length=6)
    
class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str 
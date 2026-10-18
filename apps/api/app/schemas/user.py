from pydantic import BaseModel, EmailStr
from typing import Optional

# Frontend se aane wala data (Register ke time)
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    business_name: str
    business_type: str # 'hotel', 'restaurant', or 'both'

# Frontend ko bheja jane wala data (Password hide karke)
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    business_id: str

    class Config:
        from_attributes = True

# JWT Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str
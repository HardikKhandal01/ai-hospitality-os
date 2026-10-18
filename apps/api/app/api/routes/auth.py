from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token
from app.models.user import User
from app.models.business import Business
from app.core.security import get_password_hash, verify_password, create_access_token
import re

router = APIRouter()

def create_slug(name: str) -> str:
    # Business name ko URL friendly banayega (e.g., "Hotel Royal" -> "hotel-royal")
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name).strip().lower()
    return re.sub(r'[\s-]+', '-', slug)

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    user_exists = db.query(User).filter(User.email == user_in.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 1. Create Business First
    base_slug = create_slug(user_in.business_name)
    business = Business(
        name=user_in.business_name,
        slug=base_slug,
        business_type=user_in.business_type
    )
    db.add(business)
    db.commit()
    db.refresh(business)

    # 2. Create User (as Owner) and link to Business
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role="owner",
        business_id=business.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate User
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Generate JWT Token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}
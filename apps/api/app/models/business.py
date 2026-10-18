from sqlalchemy import Column, String, Boolean, DateTime, func
from app.db.database import Base
import uuid

class Business(Base):
    __tablename__ = "businesses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False) # e.g., 'royal-haven-jaipur'
    business_type = Column(String, nullable=False) # 'hotel', 'restaurant', or 'both'
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
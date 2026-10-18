from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from app.db.database import Base
import uuid

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    mode = Column(String, default="hotel") # 'hotel' or 'restaurant'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("ai_conversations.id"), nullable=False, index=True)
    sender = Column(String, nullable=False) # 'user' or 'ai'
    content = Column(Text, nullable=False)
    key_used = Column(String, nullable=True) # e.g., 'Key #1' (Security Point #19: actual key log nahi hogi)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    total_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
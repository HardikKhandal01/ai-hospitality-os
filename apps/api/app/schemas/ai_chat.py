from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    business_id: Optional[str] = "demo-business"
    business_name: Optional[str] = "Royal Haven Jaipur"
    mode: str = "hotel"
    conversation_id: Optional[str] = None
    message: str
    is_voice: bool = False
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_data: Optional[str] = None # Base64 encoded image/file for Gemini vision

class MessageHistoryItem(BaseModel):
    id: str
    sender: str
    content: str
    created_at: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    active_key_slot: str
    mode: str
    action_executed: Optional[str] = None
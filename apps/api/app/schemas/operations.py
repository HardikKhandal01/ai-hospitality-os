from pydantic import BaseModel
from typing import Optional, List

class CalendarEventResponse(BaseModel):
    id: str
    source_reference: str
    event_type: str
    title: str
    guest_name: str
    guest_phone: str
    guests_count: int
    start_date: str
    end_date: str
    time_slot: str
    purpose: str
    notes: Optional[str]
    status: str
    google_calendar_url: str

class NotificationLogResponse(BaseModel):
    id: str
    source_reference: str
    channel: str
    recipient_role: str
    recipient_address: str
    message_body: str
    delivery_status: str
    retry_count: int
    created_at: str
    whatsapp_deeplink: str

class OperationsSyncResponse(BaseModel):
    calendar_events: List[CalendarEventResponse]
    notifications: List[NotificationLogResponse]
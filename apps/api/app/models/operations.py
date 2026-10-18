from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, func
from app.db.database import Base
import uuid

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_reference = Column(String, unique=True, index=True, nullable=False) # e.g., HTL-1024, GB-2041, CB-3011
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    
    event_type = Column(String, nullable=False) # 'Room Booking', 'Wedding Banquet', 'Manager Callback'
    title = Column(String, nullable=False)
    guest_name = Column(String, nullable=False)
    guest_phone = Column(String, nullable=False)
    guests_count = Column(Integer, default=2)
    
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    time_slot = Column(String, default="12:00 PM Check-In")
    purpose = Column(String, default="Leisure")
    notes = Column(Text, nullable=True)
    status = Column(String, default="Scheduled") # Confirmed, Scheduled, Completed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_reference = Column(String, index=True, nullable=False) # Links to Booking/Order ID
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    
    channel = Column(String, default="WhatsApp") # 'WhatsApp' or 'Email'
    recipient_role = Column(String, nullable=False) # 'Customer', 'Hotel Owner', 'Kitchen', 'Housekeeping'
    recipient_address = Column(String, nullable=False)
    message_body = Column(Text, nullable=False)
    
    delivery_status = Column(String, default="Delivered (Demo Mode)") # Delivered (Demo Mode), Sent, Failed
    retry_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
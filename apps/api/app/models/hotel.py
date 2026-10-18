from sqlalchemy import Column, String, Integer, Float, Boolean, Date, DateTime, Text, ForeignKey, func
from app.db.database import Base
import uuid

class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    name = Column(String, nullable=False) # Single, Double, Deluxe, Suite, Family
    description = Column(Text, nullable=True)
    price_per_night = Column(Float, nullable=False)
    capacity = Column(Integer, default=2) # Max guests per room
    total_inventory = Column(Integer, nullable=False) # Total rooms of this type
    amenities = Column(String, default="Wi-Fi, AC, Smart TV, Room Service")
    extra_guest_charge = Column(Float, default=500.0)
    cancellation_policy = Column(String, default="Free cancellation up to 24 hours before check-in")
    is_active = Column(Boolean, default=True)

class RoomBooking(Base):
    __tablename__ = "room_bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_reference = Column(String, unique=True, index=True, nullable=False) # e.g., HTL-1024
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    room_type_id = Column(String, ForeignKey("room_types.id"), nullable=False, index=True)
    
    guest_name = Column(String, nullable=False)
    guest_phone = Column(String, nullable=False)
    guest_email = Column(String, nullable=True)
    
    check_in_date = Column(Date, nullable=False, index=True)
    check_out_date = Column(Date, nullable=False, index=True)
    rooms_count = Column(Integer, default=1, nullable=False)
    guests_count = Column(Integer, default=2, nullable=False)
    purpose = Column(String, default="Leisure") # Leisure, Business, Wedding, etc.
    
    total_amount = Column(Float, nullable=False)
    payment_option = Column(String, default="pay_at_hotel") # advance_20, full_payment, pay_at_hotel
    payment_status = Column(String, default="pending") # pending, advance_paid, paid
    booking_status = Column(String, default="confirmed") # confirmed, cancelled, checked_out
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GroupBanquetBooking(Base):
    __tablename__ = "group_banquet_bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_code = Column(String, unique=True, index=True, nullable=False) # e.g., GB-1024
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    
    guest_name = Column(String, nullable=False)
    guest_phone = Column(String, nullable=False)
    event_type = Column(String, nullable=False) # Wedding, Corporate Event, Engagement
    
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    rooms_required = Column(Integer, nullable=False) # Configurable up to 50+ rooms
    expected_guests = Column(Integer, nullable=False) # Up to 500 guests
    banquet_hall_required = Column(Boolean, default=True)
    catering_required = Column(Boolean, default=True)
    special_notes = Column(Text, nullable=True)
    
    estimated_amount = Column(Float, nullable=False)
    status = Column(String, default="inquiry_received") # inquiry_received, approved, confirmed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RoomServiceOrder(Base):
    __tablename__ = "room_service_orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_reference = Column(String, unique=True, index=True, nullable=False) # e.g., RS-4021
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    room_number = Column(String, nullable=False)
    guest_name = Column(String, nullable=True)
    category = Column(String, default="Room Service") # Food, Drinks, Housekeeping, Maintenance, Amenities
    items_summary = Column(Text, nullable=False)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="Pending") # Pending -> Preparing -> Delivered
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class HumanCallback(Base):
    __tablename__ = "human_callbacks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_code = Column(String, unique=True, index=True, nullable=False) # e.g., CB-1092
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    guest_name = Column(String, nullable=False)
    guest_phone = Column(String, nullable=False)
    preferred_time = Column(String, default="10:00 AM Tomorrow")
    reason = Column(Text, nullable=True)
    status = Column(String, default="Scheduled")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List

class RoomTypeResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price_per_night: float
    capacity: int
    total_inventory: int
    available_rooms: int
    amenities: str
    cancellation_policy: str

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    business_id: Optional[str] = "demo-business"
    room_type_id: str
    guest_name: str = Field(..., min_length=2, max_length=100)
    guest_phone: str = Field(..., min_length=10, max_length=15)
    guest_email: Optional[str] = None
    check_in_date: date
    check_out_date: date
    rooms_count: int = Field(default=1, ge=1, le=50)
    guests_count: int = Field(default=2, ge=1, le=150)
    purpose: str = "Leisure"
    payment_option: str = "pay_at_hotel"

class BookingResponse(BaseModel):
    id: str
    booking_reference: str
    room_type_id: str
    guest_name: str
    guest_phone: str
    check_in_date: date
    check_out_date: date
    rooms_count: int
    guests_count: int
    purpose: str
    total_amount: float
    payment_option: str
    payment_status: str
    booking_status: str

    class Config:
        from_attributes = True

class GroupBookingCreate(BaseModel):
    business_id: Optional[str] = "demo-business"
    guest_name: str = Field(..., min_length=2, max_length=100)
    guest_phone: str = Field(..., min_length=10, max_length=15)
    event_type: str = "Wedding & Banquet"
    check_in_date: date
    check_out_date: date
    rooms_required: int = Field(..., ge=5, le=50)
    expected_guests: int = Field(..., ge=20, le=500)
    banquet_hall_required: bool = True
    catering_required: bool = True
    special_notes: Optional[str] = None

class GroupBookingResponse(BaseModel):
    id: str
    reference_code: str
    guest_name: str
    guest_phone: str
    event_type: str
    check_in_date: date
    check_out_date: date
    rooms_required: int
    expected_guests: int
    banquet_hall_required: bool
    catering_required: bool
    estimated_amount: float
    status: str

    class Config:
        from_attributes = True
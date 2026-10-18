from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional, List, Any

class DashboardLoginRequest(BaseModel):
    email: EmailStr
    password: str

class DashboardLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str
    role: str
    business_name: str

class ExpenseCreate(BaseModel):
    category: str
    title: str
    amount: float = Field(..., gt=0)
    expense_date: Optional[date] = None
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    category: str
    title: str
    amount: float
    expense_date: str
    notes: Optional[str]

class FeedbackCreate(BaseModel):
    module: str = "hotel"
    guest_name: str
    rating: int = Field(default=5, ge=1, le=5)
    comment: str

class FeedbackResponse(BaseModel):
    id: str
    module: str
    guest_name: str
    rating: int
    comment: str
    created_at: str

class StaffMemberCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str # owner, manager, receptionist, kitchen, housekeeping

class StaffMemberResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    is_active: bool

class DashboardOverviewResponse(BaseModel):
    hotel_revenue: float
    restaurant_revenue: float
    room_service_revenue: float
    total_revenue: float
    total_expenses: float
    estimated_net_profit: float
    
    total_rooms_inventory: int
    occupied_rooms: int
    occupancy_rate: float
    total_bookings: int
    group_banquet_count: int
    total_restaurant_orders: int
    pending_kitchen_orders: int
    pending_room_service: int
    scheduled_callbacks: int
    
    total_ai_requests: int
    failed_ai_requests: int
    configured_ai_keys: int
    average_rating: float
    total_reviews: int
    
    expenses: List[ExpenseResponse]
    feedbacks: List[FeedbackResponse]
    staff_members: List[StaffMemberResponse]
    recent_bookings: List[Any]
    recent_orders: List[Any]
    recent_room_service: List[Any]
    recent_callbacks: List[Any]
from pydantic import BaseModel, Field
from typing import Optional, List

class MenuItemResponse(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str]
    image_url: Optional[str]
    is_veg: bool
    is_spicy: bool
    allergens: str
    ingredients: Optional[str]
    has_half_full: bool
    half_price: Optional[float]
    full_price: float
    is_available: bool

    class Config:
        from_attributes = True

class OrderCartItem(BaseModel):
    menu_item_id: str
    name: str
    variant: str = "Full" # 'Half', 'Full', or 'Regular'
    quantity: int = Field(default=1, ge=1, le=20)
    unit_price: float

class RestaurantOrderCreate(BaseModel):
    business_id: Optional[str] = "demo-business"
    table_number: int = Field(..., ge=1, le=50)
    customer_name: str = Field(..., min_length=2, max_length=100)
    items: List[OrderCartItem]
    payment_mode: str = "pay_later" # 'pay_now' or 'pay_later'

class RestaurantOrderResponse(BaseModel):
    id: str
    order_reference: str
    table_number: int
    customer_name: str
    items_summary: str
    order_total: float
    kitchen_status: str
    payment_mode: str
    payment_status: str
    created_at: Optional[str] = None

class TableRunningBillResponse(BaseModel):
    table_number: int
    customer_name: Optional[str]
    orders: List[RestaurantOrderResponse]
    running_total: float
    paid_amount: float
    due_amount: float
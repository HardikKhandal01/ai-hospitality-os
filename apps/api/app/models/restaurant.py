from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, func
from app.db.database import Base
import uuid

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False) # Starters, Main Course, Breads & Rice, Drinks, Desserts
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    
    is_veg = Column(Boolean, default=True)
    is_spicy = Column(Boolean, default=False)
    allergens = Column(String, default="None") # e.g., Dairy, Nuts, Gluten
    ingredients = Column(String, nullable=True)
    
    has_half_full = Column(Boolean, default=False)
    half_price = Column(Float, nullable=True)
    full_price = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)

class RestaurantOrder(Base):
    __tablename__ = "restaurant_orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_reference = Column(String, unique=True, index=True, nullable=False) # e.g., ORD-5012
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    
    table_number = Column(Integer, nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    items_summary = Column(Text, nullable=False) # Readable summary for Kitchen & Bill
    order_total = Column(Float, nullable=False)
    
    kitchen_status = Column(String, default="New") # New -> Preparing -> Ready -> Served
    payment_mode = Column(String, default="pay_later") # pay_now or pay_later
    payment_status = Column(String, default="Unpaid") # Unpaid or Paid
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
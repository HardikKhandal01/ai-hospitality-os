from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text, ForeignKey, func
from app.db.database import Base
import uuid

class BusinessExpense(Base):
    __tablename__ = "business_expenses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    category = Column(String, nullable=False) # Salaries, Food Costs, Utilities, Rent, Maintenance, Marketing
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CustomerFeedback(Base):
    __tablename__ = "customer_feedbacks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    module = Column(String, default="hotel") # 'hotel' or 'restaurant'
    guest_name = Column(String, nullable=False)
    rating = Column(Integer, default=5) # 1 to 5 stars
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
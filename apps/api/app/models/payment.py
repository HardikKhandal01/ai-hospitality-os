from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, func
from app.db.database import Base
import uuid

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_reference = Column(String, unique=True, index=True, nullable=False) # e.g., PAY-8041
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False, index=True)
    
    module = Column(String, nullable=False) # 'hotel' or 'restaurant'
    source_reference = Column(String, nullable=False, index=True) # e.g., HTL-1024 or Table-12
    guest_name = Column(String, nullable=False)
    
    total_bill_amount = Column(Float, nullable=False)
    amount_payable_now = Column(Float, nullable=False)
    balance_due = Column(Float, nullable=False)
    payment_policy = Column(String, nullable=False) # advance_20, advance_50, full_payment, pay_now
    
    gateway_order_id = Column(String, unique=True, index=True, nullable=False)
    gateway_payment_id = Column(String, nullable=True)
    idempotency_key = Column(String, unique=True, index=True, nullable=False)
    
    signature_verified = Column(Boolean, default=False)
    status = Column(String, default="created") # created, paid, refunded, failed
    payment_method = Column(String, default="UPI / Card")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
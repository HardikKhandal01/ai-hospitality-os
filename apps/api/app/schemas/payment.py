from pydantic import BaseModel, Field
from typing import Optional

class PaymentOrderCreate(BaseModel):
    business_id: Optional[str] = "demo-business"
    module: str # 'hotel' or 'restaurant'
    source_reference: str # Booking Ref (HTL-XXXX) or Table Number (Table-12)
    guest_name: str
    total_bill_amount: float = Field(..., gt=0)
    payment_policy: str = "advance_20" # advance_20, advance_50, full_payment, pay_now
    idempotency_key: Optional[str] = None

class PaymentVerifyRequest(BaseModel):
    transaction_id: str
    gateway_order_id: str
    gateway_payment_id: str
    gateway_signature: str
    payment_method: str = "UPI (Verified)"

class PaymentOrderResponse(BaseModel):
    transaction_id: str
    transaction_reference: str
    gateway_order_id: str
    total_bill_amount: float
    amount_payable_now: float
    balance_due: float
    payment_policy: str
    status: str
    # Provided in test mode so sandbox checkout can simulate real HMAC signing
    test_signature_token: str

class PaymentTransactionResponse(BaseModel):
    id: str
    transaction_reference: str
    module: str
    source_reference: str
    guest_name: str
    total_bill_amount: float
    amount_payable_now: float
    balance_due: float
    payment_policy: str
    gateway_order_id: str
    gateway_payment_id: Optional[str]
    signature_verified: bool
    status: str
    payment_method: str
    created_at: Optional[str] = None
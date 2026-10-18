from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hmac
import hashlib
import random
import uuid
from typing import List

from app.db.database import get_db
from app.core.config import settings
from app.models.payment import PaymentTransaction
from app.models.hotel import RoomBooking
from app.models.restaurant import RestaurantOrder
from app.api.routes.hotel import ensure_demo_hotel_inventory
from app.schemas.payment import (
    PaymentOrderCreate,
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentTransactionResponse,
)

router = APIRouter()

def compute_hmac_signature(order_id: str, payment_id: str) -> str:
    """Security Point #15: Server-side HMAC-SHA256 signature calculation"""
    secret = settings.SECRET_KEY.encode("utf-8")
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()

def format_tx(tx: PaymentTransaction) -> PaymentTransactionResponse:
    return PaymentTransactionResponse(
        id=tx.id,
        transaction_reference=tx.transaction_reference,
        module=tx.module,
        source_reference=tx.source_reference,
        guest_name=tx.guest_name,
        total_bill_amount=tx.total_bill_amount,
        amount_payable_now=tx.amount_payable_now,
        balance_due=tx.balance_due,
        payment_policy=tx.payment_policy,
        gateway_order_id=tx.gateway_order_id,
        gateway_payment_id=tx.gateway_payment_id,
        signature_verified=tx.signature_verified,
        status=tx.status,
        payment_method=tx.payment_method,
        created_at=tx.created_at.strftime("%d %b %Y, %I:%M %p") if tx.created_at else "Just now",
    )

@router.post("/create-order", response_model=PaymentOrderResponse)
def create_payment_order(req: PaymentOrderCreate, db: Session = Depends(get_db)):
    actual_business_id = ensure_demo_hotel_inventory(db, req.business_id or "demo-business")
    idem_key = req.idempotency_key or f"{req.source_reference}-{req.payment_policy}-{uuid.uuid4().hex[:6]}"

    # Idempotency Check: Prevent duplicate order creation
    existing = db.query(PaymentTransaction).filter(PaymentTransaction.idempotency_key == idem_key).first()
    if existing:
        sim_pay_id = f"pay_test_{existing.gateway_order_id[-8:]}"
        return PaymentOrderResponse(
            transaction_id=existing.id,
            transaction_reference=existing.transaction_reference,
            gateway_order_id=existing.gateway_order_id,
            total_bill_amount=existing.total_bill_amount,
            amount_payable_now=existing.amount_payable_now,
            balance_due=existing.balance_due,
            payment_policy=existing.payment_policy,
            status=existing.status,
            test_signature_token=compute_hmac_signature(existing.gateway_order_id, sim_pay_id),
        )

    # Server-Side Policy Calculation (Never trust frontend math)
    total = float(req.total_bill_amount)
    if req.payment_policy == "advance_20":
        payable_now = round(total * 0.20, 2)
    elif req.payment_policy == "advance_50":
        payable_now = round(total * 0.50, 2)
    else:
        payable_now = round(total, 2)

    balance_due = round(max(0.0, total - payable_now), 2)
    gateway_order_id = f"order_rzp_{uuid.uuid4().hex[:12]}"
    tx_ref = f"PAY-{random.randint(1000, 9999)}"

    new_tx = PaymentTransaction(
        transaction_reference=tx_ref,
        business_id=actual_business_id,
        module=req.module,
        source_reference=req.source_reference,
        guest_name=req.guest_name,
        total_bill_amount=total,
        amount_payable_now=payable_now,
        balance_due=balance_due,
        payment_policy=req.payment_policy,
        gateway_order_id=gateway_order_id,
        idempotency_key=idem_key,
        status="created",
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)

    sim_pay_id = f"pay_test_{gateway_order_id[-8:]}"
    test_sig = compute_hmac_signature(gateway_order_id, sim_pay_id)

    return PaymentOrderResponse(
        transaction_id=new_tx.id,
        transaction_reference=new_tx.transaction_reference,
        gateway_order_id=new_tx.gateway_order_id,
        total_bill_amount=new_tx.total_bill_amount,
        amount_payable_now=new_tx.amount_payable_now,
        balance_due=new_tx.balance_due,
        payment_policy=new_tx.payment_policy,
        status=new_tx.status,
        test_signature_token=test_sig,
    )

@router.post("/verify", response_model=PaymentTransactionResponse)
def verify_payment_signature(req: PaymentVerifyRequest, db: Session = Depends(get_db)):
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == req.transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Payment transaction not found")

    if tx.status == "paid":
        return format_tx(tx)

    # Security Point #15: Verify Cryptographic Signature
    expected_sig = compute_hmac_signature(req.gateway_order_id, req.gateway_payment_id)
    if not hmac.compare_digest(expected_sig, req.gateway_signature):
        tx.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid payment signature! Tampering detected.")

    tx.gateway_payment_id = req.gateway_payment_id
    tx.signature_verified = True
    tx.status = "paid"
    tx.payment_method = req.payment_method

    # Update corresponding Hotel Booking or Restaurant Table Orders
    if tx.module == "hotel":
        booking = (
            db.query(RoomBooking)
            .filter(RoomBooking.booking_reference == tx.source_reference)
            .first()
        )
        if booking:
            booking.payment_status = "paid" if tx.balance_due == 0 else "advance_paid"
    elif tx.module == "restaurant":
        # Extract table number if reference is like "Table-12"
        if tx.source_reference.startswith("Table-"):
            try:
                t_num = int(tx.source_reference.split("-")[1])
                unpaid = (
                    db.query(RestaurantOrder)
                    .filter(
                        RestaurantOrder.business_id == tx.business_id,
                        RestaurantOrder.table_number == t_num,
                        RestaurantOrder.payment_status == "Unpaid",
                    )
                    .all()
                )
                for o in unpaid:
                    o.payment_status = "Paid"
            except Exception:
                pass

    db.commit()
    db.refresh(tx)
    return format_tx(tx)

@router.post("/{transaction_id}/refund", response_model=PaymentTransactionResponse)
def refund_payment(transaction_id: str, db: Session = Depends(get_db)):
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.status = "refunded"
    db.commit()
    db.refresh(tx)
    return format_tx(tx)

@router.get("/transactions", response_model=List[PaymentTransactionResponse])
def list_transactions(business_id: str = "demo-business", db: Session = Depends(get_db)):
    actual_business_id = ensure_demo_hotel_inventory(db, business_id)
    txs = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.business_id == actual_business_id)
        .order_by(PaymentTransaction.created_at.desc())
        .limit(40)
        .all()
    )
    return [format_tx(t) for t in txs]
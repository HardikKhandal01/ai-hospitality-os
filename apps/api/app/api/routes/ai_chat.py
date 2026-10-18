from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
import json
import random
import re
from typing import List

from app.db.database import get_db
from app.schemas.ai_chat import ChatRequest, ChatResponse, MessageHistoryItem
from app.models.ai_chat import AIConversation, AIMessage, AIUsage
from app.models.business import Business
from app.models.hotel import RoomType, RoomBooking, RoomServiceOrder, HumanCallback
from app.models.restaurant import RestaurantOrder
from app.api.routes.hotel import ensure_demo_hotel_inventory, calculate_available_rooms
from app.services.ai_service import ai_service

router = APIRouter()

@router.get("/history/{conversation_id}", response_model=List[MessageHistoryItem])
def get_conversation_history(conversation_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at.asc())
        .all()
    )
    return [
        MessageHistoryItem(
            id=m.id,
            sender=m.sender,
            content=m.content,
            created_at=m.created_at.isoformat() if m.created_at else None,
        )
        for m in messages
    ]

@router.post("/chat", response_model=ChatResponse)
def chat_with_receptionist(req: ChatRequest, db: Session = Depends(get_db)):
    if not req.message.strip() and not req.attachment_name:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    actual_business_id = ensure_demo_hotel_inventory(db, req.business_id or "demo-business")
    business = db.query(Business).filter(Business.id == actual_business_id).first()

    # Fetch live room availability for Hotel mode context
    today = date.today()
    tomorrow = today + timedelta(days=1)
    room_types = db.query(RoomType).filter(RoomType.business_id == actual_business_id).all()
    live_rooms_lines = []
    for rt in room_types:
        avail = calculate_available_rooms(db, rt, today, tomorrow)
        live_rooms_lines.append(
            f"- {rt.name}: ₹{rt.price_per_night}/night ({avail} available out of {rt.total_inventory}, Max {rt.capacity} guests)"
        )
    live_rooms_info = "\n".join(live_rooms_lines)

    # Fetch or create conversation
    conversation = None
    if req.conversation_id:
        conversation = db.query(AIConversation).filter(
            AIConversation.id == req.conversation_id
        ).first()

    if not conversation:
        conversation = AIConversation(
            business_id=actual_business_id,
            mode=req.mode,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    past_messages = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conversation.id)
        .order_by(AIMessage.created_at.asc())
        .limit(16)
        .all()
    )

    display_user_msg = req.message
    if req.attachment_name:
        display_user_msg = f"📎 [{req.attachment_name}] {req.message}".strip()

    user_msg = AIMessage(
        conversation_id=conversation.id,
        sender="user",
        content=display_user_msg,
    )
    db.add(user_msg)

    result = ai_service.generate_reply(
        business_name=business.name if business else "Royal Haven Jaipur",
        mode=req.mode,
        history=past_messages,
        user_message=req.message or f"Please check this uploaded file: {req.attachment_name}",
        live_rooms_info=live_rooms_info,
        attachment_data=req.attachment_data,
        attachment_type=req.attachment_type,
        attachment_name=req.attachment_name,
    )

    raw_reply = result["reply"]
    action_executed = None

    # 1. Hotel Action: Auto Room Booking
    book_match = re.search(r"\|\|ACTION_BOOK:(\{.*?\})\|\|", raw_reply, re.DOTALL)
    if book_match:
        try:
            payload = json.loads(book_match.group(1))
            raw_reply = raw_reply.replace(book_match.group(0), "").strip()
            r_name = payload.get("room_name", "Double Comfort Room")
            matched_rt = next(
                (r for r in room_types if r_name.lower() in r.name.lower()),
                room_types[0] if room_types else None,
            )
            if matched_rt:
                rooms_cnt = int(payload.get("rooms_count", 1))
                nights_cnt = max(1, int(payload.get("nights", 1)))
                avail = calculate_available_rooms(db, matched_rt, today, today + timedelta(days=nights_cnt))
                if avail >= rooms_cnt:
                    ref = f"HTL-{random.randint(1000, 9999)}"
                    total_amt = matched_rt.price_per_night * rooms_cnt * nights_cnt
                    new_bk = RoomBooking(
                        booking_reference=ref,
                        business_id=actual_business_id,
                        room_type_id=matched_rt.id,
                        guest_name=payload.get("guest_name", "Valued Guest"),
                        guest_phone=str(payload.get("guest_phone", "9999999999")),
                        check_in_date=today,
                        check_out_date=today + timedelta(days=nights_cnt),
                        rooms_count=rooms_cnt,
                        guests_count=rooms_cnt * 2,
                        purpose="AI Concierge Booking",
                        total_amount=total_amt,
                        payment_option="pay_at_hotel",
                        payment_status="pending",
                        booking_status="confirmed",
                    )
                    db.add(new_bk)
                    raw_reply += f"\n\n✅ **Instant Booking Confirmed!**\n• **Booking ID:** `{ref}`\n• **Room:** {matched_rt.name} ({rooms_cnt} Room)\n• **Total Bill:** ₹{total_amt}"
                    action_executed = "room_booked"
        except Exception:
            pass

    # 2. Hotel Action: Room Service / Housekeeping / Maintenance Order
    service_match = re.search(r"\|\|ACTION_SERVICE:(\{.*?\})\|\|", raw_reply, re.DOTALL)
    if service_match:
        try:
            payload = json.loads(service_match.group(1))
            raw_reply = raw_reply.replace(service_match.group(0), "").strip()
            ref = f"RS-{random.randint(1000, 9999)}"
            new_rs = RoomServiceOrder(
                order_reference=ref,
                business_id=actual_business_id,
                room_number=str(payload.get("room_number", "101")),
                category=payload.get("category", "Room Service"),
                items_summary=payload.get("items", "Guest Request"),
                total_amount=float(payload.get("amount", 0)),
                status="Pending",
            )
            db.add(new_rs)
            raw_reply += f"\n\n🔔 **Room Service Dispatched!**\n• **Order ID:** `{ref}`\n• **Room:** {new_rs.room_number}\n• **Request:** {new_rs.items_summary}"
            action_executed = "service_ordered"
        except Exception:
            pass

    # 3. Hotel Action: Human Manager Callback
    cb_match = re.search(r"\|\|ACTION_CALLBACK:(\{.*?\})\|\|", raw_reply, re.DOTALL)
    if cb_match:
        try:
            payload = json.loads(cb_match.group(1))
            raw_reply = raw_reply.replace(cb_match.group(0), "").strip()
            ref = f"CB-{random.randint(1000, 9999)}"
            new_cb = HumanCallback(
                reference_code=ref,
                business_id=actual_business_id,
                guest_name=payload.get("guest_name", "Valued Guest"),
                guest_phone=str(payload.get("guest_phone", "9999999999")),
                preferred_time=payload.get("preferred_time", "10:00 AM Tomorrow"),
                reason=payload.get("reason", "Manager Assistance"),
            )
            db.add(new_cb)
            raw_reply += f"\n\n📞 **Manager Callback Scheduled!**\n• **Reference:** `{ref}`\n• **Scheduled Slot:** {new_cb.preferred_time}"
            action_executed = "callback_scheduled"
        except Exception:
            pass

    # 4. Restaurant Action: Auto Table Food Order to Kitchen
    rest_match = re.search(r"\|\|ACTION_REST_ORDER:(\{.*?\})\|\|", raw_reply, re.DOTALL)
    if rest_match:
        try:
            payload = json.loads(rest_match.group(1))
            raw_reply = raw_reply.replace(rest_match.group(0), "").strip()
            ref = f"ORD-{random.randint(1000, 9999)}"
            p_mode = payload.get("payment_mode", "pay_later")
            new_ro = RestaurantOrder(
                order_reference=ref,
                business_id=actual_business_id,
                table_number=int(payload.get("table_number", 12)),
                customer_name=payload.get("customer_name", "Table Guest"),
                items_summary=payload.get("items", "Chef Special Selection"),
                order_total=float(payload.get("amount", 350)),
                kitchen_status="New",
                payment_mode=p_mode,
                payment_status="Paid" if p_mode == "pay_now" else "Unpaid",
            )
            db.add(new_ro)
            raw_reply += f"\n\n🍽️ **Kitchen Order Sent!**\n• **Order ID:** `{ref}`\n• **Table:** #{new_ro.table_number} ({new_ro.customer_name})\n• **Items:** {new_ro.items_summary}\n• **Bill Added:** ₹{new_ro.order_total}"
            action_executed = "restaurant_ordered"
        except Exception:
            pass

    ai_msg = AIMessage(
        conversation_id=conversation.id,
        sender="ai",
        content=raw_reply,
        key_used=result["key_used"],
    )
    db.add(ai_msg)

    usage = db.query(AIUsage).filter(AIUsage.business_id == actual_business_id).first()
    if not usage:
        usage = AIUsage(business_id=actual_business_id, total_requests=0, failed_requests=0)
        db.add(usage)

    usage.total_requests += 1
    if not result["success"]:
        usage.failed_requests += 1

    db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        reply=raw_reply,
        active_key_slot=result["key_used"],
        mode=req.mode,
        action_executed=action_executed,
    )
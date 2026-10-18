from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from urllib.parse import quote
from datetime import date, timedelta
import random

from app.db.database import get_db
from app.models.operations import CalendarEvent, NotificationLog
from app.models.hotel import RoomType, RoomBooking, GroupBanquetBooking, RoomServiceOrder, HumanCallback
from app.models.restaurant import RestaurantOrder
from app.api.routes.hotel import ensure_demo_hotel_inventory
from app.schemas.operations import (
    CalendarEventResponse,
    NotificationLogResponse,
    OperationsSyncResponse,
)

router = APIRouter()

def build_google_calendar_url(ev: CalendarEvent) -> str:
    """Generates a 1-click Google Calendar template URL"""
    start_clean = ev.start_date.replace("-", "")
    end_clean = ev.end_date.replace("-", "")
    if len(start_clean) != 8:
        start_clean = date.today().strftime("%Y%m%d")
        end_clean = (date.today() + timedelta(days=1)).strftime("%Y%m%d")
    details = (
        f"Reference: {ev.source_reference}\n"
        f"Guest: {ev.guest_name} ({ev.guest_phone})\n"
        f"Guests Count: {ev.guests_count}\n"
        f"Purpose: {ev.purpose}\n"
        f"Slot: {ev.time_slot}\n"
        f"Notes: {ev.notes or 'N/A'}"
    )
    return (
        f"https://calendar.google.com/calendar/render?action=TEMPLATE"
        f"&text={quote(ev.title)}"
        f"&dates={start_clean}/{end_clean}"
        f"&details={quote(details)}"
        f"&location={quote('Royal Haven Jaipur')}"
    )

def sync_bookings_and_orders_to_operations(db: Session, business_id: str):
    """Automatically converts any new bookings/orders/callbacks into Calendar Events & WhatsApp/Email Logs"""
    # 1. Sync Room Bookings -> Calendar + Owner/Customer WhatsApp + Email
    bookings = db.query(RoomBooking).filter(RoomBooking.business_id == business_id).all()
    for b in bookings:
        exists = db.query(CalendarEvent).filter(CalendarEvent.source_reference == b.booking_reference).first()
        if not exists:
            room = db.query(RoomType).filter(RoomType.id == b.room_type_id).first()
            r_name = room.name if room else "Luxury Room"
            ev = CalendarEvent(
                source_reference=b.booking_reference,
                business_id=business_id,
                event_type="Room Booking",
                title=f"🏨 {r_name} ({b.rooms_count}x) — {b.guest_name}",
                guest_name=b.guest_name,
                guest_phone=b.guest_phone,
                guests_count=b.guests_count,
                start_date=str(b.check_in_date),
                end_date=str(b.check_out_date),
                time_slot="12:00 PM Check-In → 11:00 AM Check-Out",
                purpose=b.purpose,
                notes=f"Total Bill: ₹{b.total_amount} | Payment: {b.payment_status.upper()}",
                status="Confirmed",
            )
            db.add(ev)

            # WhatsApp to Customer
            db.add(
                NotificationLog(
                    source_reference=b.booking_reference,
                    business_id=business_id,
                    channel="WhatsApp",
                    recipient_role="Customer",
                    recipient_address=b.guest_phone,
                    message_body=(
                        f"✅ *Royal Haven Jaipur — Booking Confirmed!*\n"
                        f"Booking ID: *{b.booking_reference}*\n"
                        f"Guest: {b.guest_name} ({b.guests_count} Guests)\n"
                        f"Room: {r_name} ({b.rooms_count} Room)\n"
                        f"Check-In: {b.check_in_date} | Check-Out: {b.check_out_date}\n"
                        f"Total Amount: ₹{b.total_amount} ({b.payment_status.upper()})"
                    ),
                )
            )
            # WhatsApp to Hotel Owner
            db.add(
                NotificationLog(
                    source_reference=f"{b.booking_reference}-OWN",
                    business_id=business_id,
                    channel="WhatsApp",
                    recipient_role="Hotel Owner",
                    recipient_address="Owner WhatsApp (+91-9876543210)",
                    message_body=(
                        f"🔔 *New Room Booking Alert ({b.booking_reference})*\n"
                        f"Guest: {b.guest_name} | Phone: {b.guest_phone}\n"
                        f"Room: {b.rooms_count}x {r_name} | Purpose: {b.purpose}\n"
                        f"Dates: {b.check_in_date} to {b.check_out_date}\n"
                        f"Bill: ₹{b.total_amount} | Status: {b.payment_status.upper()}"
                    ),
                )
            )

    # 2. Sync Wedding / Group Banquet Bookings -> Calendar + Owner Email/WhatsApp
    groups = db.query(GroupBanquetBooking).filter(GroupBanquetBooking.business_id == business_id).all()
    for g in groups:
        exists = db.query(CalendarEvent).filter(CalendarEvent.source_reference == g.reference_code).first()
        if not exists:
            ev = CalendarEvent(
                source_reference=g.reference_code,
                business_id=business_id,
                event_type="Wedding Banquet",
                title=f"🎉 {g.event_type} ({g.rooms_required} Rooms) — {g.guest_name}",
                guest_name=g.guest_name,
                guest_phone=g.guest_phone,
                guests_count=g.expected_guests,
                start_date=str(g.check_in_date),
                end_date=str(g.check_out_date),
                time_slot="Full Property & Grand Banquet Block",
                purpose=g.event_type,
                notes=f"{g.rooms_required} Rooms + {g.expected_guests} Guests | Est. Quote: ₹{g.estimated_amount}",
                status="Block Reserved",
            )
            db.add(ev)
            db.add(
                NotificationLog(
                    source_reference=g.reference_code,
                    business_id=business_id,
                    channel="Email",
                    recipient_role="Hotel Owner",
                    recipient_address="owner@royalhavenjaipur.com",
                    message_body=(
                        f"🎊 [HIGH-VALUE WEDDING BLOCK {g.reference_code}] {g.guest_name} ({g.guest_phone}) "
                        f"requested {g.rooms_required} Rooms & Banquet for {g.expected_guests} guests. "
                        f"Estimated Package: ₹{g.estimated_amount:,.0f}."
                    ),
                )
            )

    # 3. Sync Human Manager Callbacks -> Calendar + Owner Alert
    callbacks = db.query(HumanCallback).filter(HumanCallback.business_id == business_id).all()
    for cb in callbacks:
        exists = db.query(CalendarEvent).filter(CalendarEvent.source_reference == cb.reference_code).first()
        if not exists:
            today_str = str(date.today() + timedelta(days=1))
            ev = CalendarEvent(
                source_reference=cb.reference_code,
                business_id=business_id,
                event_type="Manager Callback",
                title=f"📞 Morning Call: {cb.guest_name} ({cb.preferred_time})",
                guest_name=cb.guest_name,
                guest_phone=cb.guest_phone,
                guests_count=1,
                start_date=today_str,
                end_date=today_str,
                time_slot=cb.preferred_time,
                purpose=cb.reason or "Manager Escalation",
                notes=f"Scheduled by Aaradhya AI during night/busy hours. Call {cb.guest_phone}.",
                status="Scheduled",
            )
            db.add(ev)
            db.add(
                NotificationLog(
                    source_reference=cb.reference_code,
                    business_id=business_id,
                    channel="WhatsApp",
                    recipient_role="Hotel Owner",
                    recipient_address="Manager Desk (+91-9876543210)",
                    message_body=(
                        f"📞 *Human Callback Scheduled ({cb.reference_code})*\n"
                        f"Guest: {cb.guest_name} | Phone: {cb.guest_phone}\n"
                        f"Preferred Slot: {cb.preferred_time}\n"
                        f"Reason: {cb.reason}"
                    ),
                )
            )

    # 4. Sync Room Service Orders -> Kitchen / Housekeeping WhatsApp Alerts
    rs_orders = db.query(RoomServiceOrder).filter(RoomServiceOrder.business_id == business_id).all()
    for rs in rs_orders:
        exists = db.query(NotificationLog).filter(NotificationLog.source_reference == rs.order_reference).first()
        if not exists:
            lower_items = rs.items_summary.lower()
            is_housekeeping = any(
                w in lower_items for w in ["towel", "clean", "pillow", "soap", "shampoo", "ac", "tv", "wi-fi"]
            )
            role = "Housekeeping" if is_housekeeping else "Kitchen"
            icon = "🧹" if is_housekeeping else "🍽️"
            db.add(
                NotificationLog(
                    source_reference=rs.order_reference,
                    business_id=business_id,
                    channel="WhatsApp",
                    recipient_role=role,
                    recipient_address=f"{role} Staff Group",
                    message_body=(
                        f"{icon} *New {role} Request ({rs.order_reference})*\n"
                        f"Room No: *Room {rs.room_number}*\n"
                        f"Items / Task: {rs.items_summary}\n"
                        f"Bill Added: ₹{rs.total_amount} | Status: {rs.status}"
                    ),
                )
            )

    # 5. Sync Restaurant Table Orders -> Kitchen & Owner WhatsApp Alerts
    rest_orders = db.query(RestaurantOrder).filter(RestaurantOrder.business_id == business_id).all()
    for ro in rest_orders:
        exists = db.query(NotificationLog).filter(NotificationLog.source_reference == ro.order_reference).first()
        if not exists:
            db.add(
                NotificationLog(
                    source_reference=ro.order_reference,
                    business_id=business_id,
                    channel="WhatsApp",
                    recipient_role="Kitchen",
                    recipient_address="Restaurant Kitchen KDS",
                    message_body=(
                        f"🔥 *Table #{ro.table_number} Food Order ({ro.order_reference})*\n"
                        f"Guest: {ro.customer_name}\n"
                        f"Order: {ro.items_summary}\n"
                        f"Bill: ₹{ro.order_total} | Payment: *{ro.payment_status.upper()}* ({ro.payment_mode})"
                    ),
                )
            )

    db.commit()

@router.get("/overview", response_model=OperationsSyncResponse)
def get_operations_overview(business_id: str = "demo-business", db: Session = Depends(get_db)):
    actual_business_id = ensure_demo_hotel_inventory(db, business_id)
    sync_bookings_and_orders_to_operations(db, actual_business_id)

    events = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.business_id == actual_business_id)
        .order_by(CalendarEvent.created_at.desc())
        .limit(30)
        .all()
    )
    logs = (
        db.query(NotificationLog)
        .filter(NotificationLog.business_id == actual_business_id)
        .order_by(NotificationLog.created_at.desc())
        .limit(40)
        .all()
    )

    return OperationsSyncResponse(
        calendar_events=[
            CalendarEventResponse(
                id=e.id,
                source_reference=e.source_reference,
                event_type=e.event_type,
                title=e.title,
                guest_name=e.guest_name,
                guest_phone=e.guest_phone,
                guests_count=e.guests_count,
                start_date=e.start_date,
                end_date=e.end_date,
                time_slot=e.time_slot,
                purpose=e.purpose,
                notes=e.notes,
                status=e.status,
                google_calendar_url=build_google_calendar_url(e),
            )
            for e in events
        ],
        notifications=[
            NotificationLogResponse(
                id=n.id,
                source_reference=n.source_reference,
                channel=n.channel,
                recipient_role=n.recipient_role,
                recipient_address=n.recipient_address,
                message_body=n.message_body,
                delivery_status=n.delivery_status,
                retry_count=n.retry_count,
                created_at=n.created_at.strftime("%I:%M %p") if n.created_at else "Just now",
                whatsapp_deeplink=f"https://wa.me/919876543210?text={quote(n.message_body)}",
            )
            for n in logs
        ],
    )

@router.post("/simulate-230am-demo", response_model=OperationsSyncResponse)
def simulate_killer_sales_demo(business_id: str = "demo-business", db: Session = Depends(get_db)):
    """Simulates the 2:30 AM Killer Sales Demo (Booking + Room 204 Water + Morning Call + Table #12 Order)"""
    actual_business_id = ensure_demo_hotel_inventory(db, business_id)
    room = db.query(RoomType).filter(RoomType.business_id == actual_business_id).first()
    today = date.today()
    tomorrow = today + timedelta(days=1)

    if room:
        bk_ref = f"HTL-{random.randint(1000, 9999)}"
        db.add(
            RoomBooking(
                booking_reference=bk_ref,
                business_id=actual_business_id,
                room_type_id=room.id,
                guest_name="Aarav Mehta (2:30 AM Guest)",
                guest_phone="9829012345",
                check_in_date=today,
                check_out_date=tomorrow,
                rooms_count=1,
                guests_count=2,
                purpose="Business & Leisure",
                total_amount=room.price_per_night,
                payment_option="advance_20",
                payment_status="advance_paid",
                booking_status="confirmed",
            )
        )

    db.add(
        RoomServiceOrder(
            order_reference=f"RS-{random.randint(1000, 9999)}",
            business_id=actual_business_id,
            room_number="204",
            guest_name="Aarav Mehta",
            category="Room Service",
            items_summary="2x Mineral Water Bottles & 1x Hot Paneer Tikka",
            total_amount=360.0,
            status="Pending",
        )
    )

    db.add(
        HumanCallback(
            reference_code=f"CB-{random.randint(1000, 9999)}",
            business_id=actual_business_id,
            guest_name="Aarav Mehta",
            guest_phone="9829012345",
            preferred_time="10:00 AM Tomorrow",
            reason="2:30 AM Night Inquiry — Wants to discuss extended stay",
        )
    )

    db.add(
        RestaurantOrder(
            order_reference=f"ORD-{random.randint(1000, 9999)}",
            business_id=actual_business_id,
            table_number=12,
            customer_name="Priya Singh",
            items_summary="2x Royal Paneer Tikka Angara (Full), 1x Dal Makhani (Half), 2x Garlic Naan",
            order_total=1000.0,
            kitchen_status="New",
            payment_mode="pay_later",
            payment_status="Unpaid",
        )
    )

    db.commit()
    return get_operations_overview(business_id, db)

@router.post("/notifications/{notification_id}/retry", response_model=NotificationLogResponse)
def retry_notification(notification_id: str, db: Session = Depends(get_db)):
    notif = db.query(NotificationLog).filter(NotificationLog.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.retry_count += 1
    notif.delivery_status = f"Re-Sent & Verified (Attempt #{notif.retry_count})"
    db.commit()
    db.refresh(notif)
    return NotificationLogResponse(
        id=notif.id,
        source_reference=notif.source_reference,
        channel=notif.channel,
        recipient_role=notif.recipient_role,
        recipient_address=notif.recipient_address,
        message_body=notif.message_body,
        delivery_status=notif.delivery_status,
        retry_count=notif.retry_count,
        created_at=notif.created_at.strftime("%I:%M %p") if notif.created_at else "Just now",
        whatsapp_deeplink=f"https://wa.me/919876543210?text={quote(notif.message_body)}",
    )
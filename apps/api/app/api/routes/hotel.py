from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import random
from typing import List, Optional

from app.db.database import get_db
from app.models.business import Business
from app.models.hotel import RoomType, RoomBooking, GroupBanquetBooking
from app.schemas.hotel import (
    RoomTypeResponse,
    BookingCreate,
    BookingResponse,
    GroupBookingCreate,
    GroupBookingResponse
)

router = APIRouter()

def ensure_demo_hotel_inventory(db: Session, business_id: str = "demo-business"):
    """Auto-creates demo business and 50 rooms across 5 categories if not present"""
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        business = db.query(Business).filter(Business.slug == "royal-haven-demo").first()
        if not business:
            business = Business(
                id="demo-business",
                name="Royal Haven Jaipur",
                slug="royal-haven-demo",
                business_type="both"
            )
            db.add(business)
            db.commit()
            db.refresh(business)

    existing_rooms = db.query(RoomType).filter(RoomType.business_id == business.id).count()
    if existing_rooms == 0:
        sample_rooms = [
            RoomType(
                business_id=business.id,
                name="Single Executive Room",
                description="Ideal for solo business travelers with ergonomic workspace and high-speed Wi-Fi.",
                price_per_night=2500.0,
                capacity=1,
                total_inventory=10,
                amenities="High-Speed Wi-Fi, AC, Work Desk, Smart TV, 24/7 Room Service"
            ),
            RoomType(
                business_id=business.id,
                name="Double Comfort Room",
                description="Spacious king-bed room designed for couples and comfortable city stays.",
                price_per_night=3800.0,
                capacity=2,
                total_inventory=15,
                amenities="King Bed, Wi-Fi, AC, Mini Fridge, Tea/Coffee Maker, Room Service"
            ),
            RoomType(
                business_id=business.id,
                name="Deluxe Heritage Room",
                description="Premium Rajasthani inspired interiors with balcony view and luxury bath amenities.",
                price_per_night=5200.0,
                capacity=3,
                total_inventory=12,
                amenities="Balcony View, Breakfast Included, Wi-Fi, AC, Bathtub, Mini Bar"
            ),
            RoomType(
                business_id=business.id,
                name="Family Royal Suite",
                description="Interconnected two-bedroom space built for families and group travellers.",
                price_per_night=7500.0,
                capacity=4,
                total_inventory=8,
                amenities="2 King Beds, Living Area, Free Breakfast, Wi-Fi, Smart TV, Bathtub"
            ),
            RoomType(
                business_id=business.id,
                name="Presidential Wedding Suite",
                description="Ultra-luxury suite for VIP guests, newlyweds, and dignitaries.",
                price_per_night=11500.0,
                capacity=4,
                total_inventory=5,
                amenities="Private Lounge, Butler Service, Jacuzzi, Complimentary Dining, Airport Transfer"
            ),
        ]
        db.add_all(sample_rooms)
        db.commit()
    return business.id

def calculate_available_rooms(db: Session, room_type: RoomType, check_in: date, check_out: date) -> int:
    overlapping_booked = (
        db.query(func.coalesce(func.sum(RoomBooking.rooms_count), 0))
        .filter(
            RoomBooking.room_type_id == room_type.id,
            RoomBooking.booking_status == "confirmed",
            RoomBooking.check_in_date < check_out,
            RoomBooking.check_out_date > check_in
        )
        .scalar()
    )
    available = room_type.total_inventory - int(overlapping_booked or 0)
    return max(0, available)

@router.get("/rooms", response_model=List[RoomTypeResponse])
def get_available_rooms(
    business_id: str = "demo-business",
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    db: Session = Depends(get_db)
):
    actual_business_id = ensure_demo_hotel_inventory(db, business_id)
    
    if not check_in:
        check_in = date.today()
    if not check_out or check_out <= check_in:
        check_out = check_in + timedelta(days=1)

    room_types = db.query(RoomType).filter(
        RoomType.business_id == actual_business_id,
        RoomType.is_active == True
    ).all()

    response = []
    for rt in room_types:
        avail = calculate_available_rooms(db, rt, check_in, check_out)
        response.append(
            RoomTypeResponse(
                id=rt.id,
                name=rt.name,
                description=rt.description,
                price_per_night=rt.price_per_night,
                capacity=rt.capacity,
                total_inventory=rt.total_inventory,
                available_rooms=avail,
                amenities=rt.amenities,
                cancellation_policy=rt.cancellation_policy
            )
        )
    return response

@router.post("/bookings", response_model=BookingResponse)
def create_room_booking(booking_in: BookingCreate, db: Session = Depends(get_db)):
    if booking_in.check_out_date <= booking_in.check_in_date:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date")

    # Lock RoomType row to prevent race-condition double bookings
    room_type = (
        db.query(RoomType)
        .filter(RoomType.id == booking_in.room_type_id)
        .with_for_update()
        .first()
    )
    if not room_type:
        raise HTTPException(status_code=404, detail="Selected room type not found")

    available = calculate_available_rooms(db, room_type, booking_in.check_in_date, booking_in.check_out_date)
    if booking_in.rooms_count > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} room(s) available for {room_type.name} on selected dates."
        )

    nights = (booking_in.check_out_date - booking_in.check_in_date).days
    total_amount = nights * room_type.price_per_night * booking_in.rooms_count

    booking_ref = f"HTL-{random.randint(1000, 9999)}"
    new_booking = RoomBooking(
        booking_reference=booking_ref,
        business_id=room_type.business_id,
        room_type_id=room_type.id,
        guest_name=booking_in.guest_name.strip(),
        guest_phone=booking_in.guest_phone.strip(),
        guest_email=booking_in.guest_email,
        check_in_date=booking_in.check_in_date,
        check_out_date=booking_in.check_out_date,
        rooms_count=booking_in.rooms_count,
        guests_count=booking_in.guests_count,
        purpose=booking_in.purpose,
        total_amount=total_amount,
        payment_option=booking_in.payment_option,
        payment_status="pending",
        booking_status="confirmed"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@router.post("/group-bookings", response_model=GroupBookingResponse)
def create_group_banquet_booking(group_in: GroupBookingCreate, db: Session = Depends(get_db)):
    if group_in.check_out_date <= group_in.check_in_date:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date")

    actual_business_id = ensure_demo_hotel_inventory(db, group_in.business_id or "demo-business")
    nights = (group_in.check_out_date - group_in.check_in_date).days

    # Estimate package: avg ₹4,000/room/night + ₹75,000/day banquet + ₹850/plate catering
    room_cost = group_in.rooms_required * 4000.0 * nights
    banquet_cost = 75000.0 * nights if group_in.banquet_hall_required else 0.0
    catering_cost = group_in.expected_guests * 850.0 * nights if group_in.catering_required else 0.0
    estimated_total = room_cost + banquet_cost + catering_cost

    ref_code = f"GB-{random.randint(1000, 9999)}"
    group_booking = GroupBanquetBooking(
        reference_code=ref_code,
        business_id=actual_business_id,
        guest_name=group_in.guest_name.strip(),
        guest_phone=group_in.guest_phone.strip(),
        event_type=group_in.event_type,
        check_in_date=group_in.check_in_date,
        check_out_date=group_in.check_out_date,
        rooms_required=group_in.rooms_required,
        expected_guests=group_in.expected_guests,
        banquet_hall_required=group_in.banquet_hall_required,
        catering_required=group_in.catering_required,
        special_notes=group_in.special_notes,
        estimated_amount=estimated_total,
        status="inquiry_received"
    )
    db.add(group_booking)
    db.commit()
    db.refresh(group_booking)
    return group_booking

@router.get("/bookings", response_model=List[BookingResponse])
def list_hotel_bookings(business_id: str = "demo-business", db: Session = Depends(get_db)):
    actual_business_id = ensure_demo_hotel_inventory(db, business_id)
    return (
        db.query(RoomBooking)
        .filter(RoomBooking.business_id == actual_business_id)
        .order_by(RoomBooking.created_at.desc())
        .all()
    )
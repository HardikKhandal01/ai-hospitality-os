from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
import csv
import io

from app.db.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from app.models.business import Business
from app.models.user import User
from app.models.hotel import RoomType, RoomBooking, GroupBanquetBooking, RoomServiceOrder, HumanCallback
from app.models.restaurant import RestaurantOrder
from app.models.payment import PaymentTransaction
from app.models.ai_chat import AIUsage
from app.models.dashboard import BusinessExpense, CustomerFeedback
from app.api.routes.hotel import ensure_demo_hotel_inventory
from app.api.routes.restaurant import ensure_demo_restaurant_menu
from app.schemas.dashboard import (
    DashboardLoginRequest,
    DashboardLoginResponse,
    ExpenseCreate,
    ExpenseResponse,
    FeedbackCreate,
    FeedbackResponse,
    StaffMemberCreate,
    StaffMemberResponse,
    DashboardOverviewResponse,
)

router = APIRouter()

def ensure_demo_dashboard_seed(db: Session) -> str:
    """Seeds default RBAC staff accounts, sample expenses, and guest reviews if empty"""
    business_id = ensure_demo_restaurant_menu(db, "demo-business")

    # 1. Seed Default Role-Based Staff Accounts (Password hashed with Bcrypt)
    default_staff = [
        ("owner@royalhaven.com", "Royal@2026", "Vikramaditya Rathore (Owner)", "owner"),
        ("manager@royalhaven.com", "Royal@2026", "Ananya Sharma (GM)", "manager"),
        ("reception@royalhaven.com", "Royal@2026", "Rohit Verma (Front Desk)", "receptionist"),
        ("kitchen@royalhaven.com", "Royal@2026", "Chef Ranveer (Head Chef)", "kitchen"),
        ("housekeeping@royalhaven.com", "Royal@2026", "Suresh Kumar (Housekeeping)", "housekeeping"),
    ]
    for email, plain_pwd, name, role in default_staff:
        exists = db.query(User).filter(User.email == email).first()
        if not exists:
            db.add(
                User(
                    email=email,
                    hashed_password=get_password_hash(plain_pwd),
                    full_name=name,
                    role=role,
                    business_id=business_id,
                    is_active=True,
                )
            )

    # 2. Seed Sample Operational Expenses for P&L Calculation
    exp_count = db.query(BusinessExpense).filter(BusinessExpense.business_id == business_id).count()
    if exp_count == 0:
        today = date.today()
        sample_expenses = [
            BusinessExpense(
                business_id=business_id,
                category="Salaries",
                title="Front Desk, Housekeeping & Kitchen Staff Payroll",
                amount=45000.0,
                expense_date=today,
                notes="Monthly staff payout",
            ),
            BusinessExpense(
                business_id=business_id,
                category="Food Costs",
                title="Fresh Dairy, Paneer, Spices & Organic Produce",
                amount=18500.0,
                expense_date=today,
                notes="Kitchen inventory restock",
            ),
            BusinessExpense(
                business_id=business_id,
                category="Utilities",
                title="Commercial Electricity, High-Speed Fiber & Water",
                amount=12000.0,
                expense_date=today,
                notes="Power & HVAC load",
            ),
            BusinessExpense(
                business_id=business_id,
                category="Maintenance",
                title="Pool Filtration, Linen Laundry & AC Servicing",
                amount=6500.0,
                expense_date=today,
                notes="Preventive hospitality maintenance",
            ),
        ]
        db.add_all(sample_expenses)

    # 3. Seed Sample Guest Reviews
    fb_count = db.query(CustomerFeedback).filter(CustomerFeedback.business_id == business_id).count()
    if fb_count == 0:
        sample_feedbacks = [
            CustomerFeedback(
                business_id=business_id,
                module="hotel",
                guest_name="Meera & Kabir Kapoor",
                rating=5,
                comment="Aaradhya AI booked our Deluxe Heritage Room at 1:30 AM and arranged warm milk & extra pillows in 10 minutes!",
            ),
            CustomerFeedback(
                business_id=business_id,
                module="restaurant",
                guest_name="Siddharth Malhotra",
                rating=5,
                comment="Scanned the table QR, ordered Half Paneer Tikka and Full Laal Maas. Vivaan AI guided us on nut allergies accurately.",
            ),
            CustomerFeedback(
                business_id=business_id,
                module="hotel",
                guest_name="Rajeshwari Singhania",
                rating=4,
                comment="Booked 35 rooms + Banquet for our family wedding. Seamless quotation and Google Calendar sync!",
            ),
        ]
        db.add_all(sample_feedbacks)

    db.commit()
    return business_id

@router.post("/login", response_model=DashboardLoginResponse)
def dashboard_login(req: DashboardLoginRequest, db: Session = Depends(get_db)):
    business_id = ensure_demo_dashboard_seed(db)
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    business = db.query(Business).filter(Business.id == user.business_id).first()
    token = create_access_token(data={"sub": user.id, "role": user.role, "business_id": user.business_id})

    return DashboardLoginResponse(
        access_token=token,
        token_type="bearer",
        user_name=user.full_name or "Hospitality Manager",
        user_email=user.email,
        role=user.role,
        business_name=business.name if business else "Royal Haven Jaipur",
    )

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business_id = ensure_demo_dashboard_seed(db)

    bookings = (
        db.query(RoomBooking)
        .filter(RoomBooking.business_id == business_id)
        .order_by(RoomBooking.created_at.desc())
        .all()
    )
    groups = (
        db.query(GroupBanquetBooking)
        .filter(GroupBanquetBooking.business_id == business_id)
        .order_by(GroupBanquetBooking.created_at.desc())
        .all()
    )
    rest_orders = (
        db.query(RestaurantOrder)
        .filter(RestaurantOrder.business_id == business_id)
        .order_by(RestaurantOrder.created_at.desc())
        .all()
    )
    rs_orders = (
        db.query(RoomServiceOrder)
        .filter(RoomServiceOrder.business_id == business_id)
        .order_by(RoomServiceOrder.created_at.desc())
        .all()
    )
    callbacks = (
        db.query(HumanCallback)
        .filter(HumanCallback.business_id == business_id)
        .order_by(HumanCallback.created_at.desc())
        .all()
    )
    expenses = (
        db.query(BusinessExpense)
        .filter(BusinessExpense.business_id == business_id)
        .order_by(BusinessExpense.created_at.desc())
        .all()
    )
    feedbacks = (
        db.query(CustomerFeedback)
        .filter(CustomerFeedback.business_id == business_id)
        .order_by(CustomerFeedback.created_at.desc())
        .all()
    )
    staff_list = db.query(User).filter(User.business_id == business_id).all()
    rooms = db.query(RoomType).filter(RoomType.business_id == business_id).all()
    ai_usage = db.query(AIUsage).filter(AIUsage.business_id == business_id).first()

    # Revenue & P&L Calculations
    hotel_rev = sum(b.total_amount for b in bookings if b.booking_status != "cancelled")
    rest_rev = sum(o.order_total for o in rest_orders)
    rs_rev = sum(r.total_amount for r in rs_orders)
    total_rev = round(hotel_rev + rest_rev + rs_rev, 2)
    total_exp = round(sum(e.amount for e in expenses), 2)
    net_profit = round(total_rev - total_exp, 2)

    # Occupancy Calculation
    total_inv = sum(r.total_inventory for r in rooms) or 50
    occupied = sum(b.rooms_count for b in bookings if b.booking_status == "confirmed")
    occupied_capped = min(total_inv, occupied)
    occ_rate = round((occupied_capped / total_inv) * 100, 1) if total_inv > 0 else 0.0

    # Ratings
    avg_rating = (
        round(sum(f.rating for f in feedbacks) / len(feedbacks), 1)
        if feedbacks
        else 5.0
    )

    return DashboardOverviewResponse(
        hotel_revenue=hotel_rev,
        restaurant_revenue=rest_rev,
        room_service_revenue=rs_rev,
        total_revenue=total_rev,
        total_expenses=total_exp,
        estimated_net_profit=net_profit,
        total_rooms_inventory=total_inv,
        occupied_rooms=occupied_capped,
        occupancy_rate=occ_rate,
        total_bookings=len(bookings),
        group_banquet_count=len(groups),
        total_restaurant_orders=len(rest_orders),
        pending_kitchen_orders=sum(1 for o in rest_orders if o.kitchen_status != "Served"),
        pending_room_service=sum(1 for r in rs_orders if r.status != "Delivered"),
        scheduled_callbacks=len(callbacks),
        total_ai_requests=ai_usage.total_requests if ai_usage else 0,
        failed_ai_requests=ai_usage.failed_requests if ai_usage else 0,
        configured_ai_keys=len(settings.get_gemini_keys()),
        average_rating=avg_rating,
        total_reviews=len(feedbacks),
        expenses=[
            ExpenseResponse(
                id=e.id,
                category=e.category,
                title=e.title,
                amount=e.amount,
                expense_date=str(e.expense_date),
                notes=e.notes,
            )
            for e in expenses
        ],
        feedbacks=[
            FeedbackResponse(
                id=f.id,
                module=f.module,
                guest_name=f.guest_name,
                rating=f.rating,
                comment=f.comment,
                created_at=f.created_at.strftime("%d %b %Y") if f.created_at else "Recent",
            )
            for f in feedbacks
        ],
        staff_members=[
            StaffMemberResponse(
                id=u.id,
                full_name=u.full_name or u.email,
                email=u.email,
                role=u.role,
                is_active=u.is_active,
            )
            for u in staff_list
        ],
        recent_bookings=[
            {
                "id": b.id,
                "reference": b.booking_reference,
                "guest_name": b.guest_name,
                "guest_phone": b.guest_phone,
                "check_in": str(b.check_in_date),
                "check_out": str(b.check_out_date),
                "rooms": b.rooms_count,
                "amount": b.total_amount,
                "payment_status": b.payment_status,
            }
            for b in bookings[:15]
        ],
        recent_orders=[
            {
                "id": o.id,
                "reference": o.order_reference,
                "table_number": o.table_number,
                "customer_name": o.customer_name,
                "items": o.items_summary,
                "amount": o.order_total,
                "kitchen_status": o.kitchen_status,
                "payment_status": o.payment_status,
            }
            for o in rest_orders[:15]
        ],
        recent_room_service=[
            {
                "id": r.id,
                "reference": r.order_reference,
                "room_number": r.room_number,
                "category": r.category,
                "items": r.items_summary,
                "amount": r.total_amount,
                "status": r.status,
            }
            for r in rs_orders[:15]
        ],
        recent_callbacks=[
            {
                "id": c.id,
                "reference": c.reference_code,
                "guest_name": c.guest_name,
                "guest_phone": c.guest_phone,
                "preferred_time": c.preferred_time,
                "reason": c.reason,
                "status": c.status,
            }
            for c in callbacks[:15]
        ],
    )

@router.post("/expenses", response_model=ExpenseResponse)
def add_business_expense(
    exp_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["owner", "manager"]:
        raise HTTPException(status_code=403, detail="Only Owner or Manager can record expenses")

    new_exp = BusinessExpense(
        business_id=current_user.business_id,
        category=exp_in.category,
        title=exp_in.title.strip(),
        amount=exp_in.amount,
        expense_date=exp_in.expense_date or date.today(),
        notes=exp_in.notes,
    )
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return ExpenseResponse(
        id=new_exp.id,
        category=new_exp.category,
        title=new_exp.title,
        amount=new_exp.amount,
        expense_date=str(new_exp.expense_date),
        notes=new_exp.notes,
    )

@router.post("/staff", response_model=StaffMemberResponse)
def create_staff_member(
    staff_in: StaffMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only Owner can create new staff accounts")

    exists = db.query(User).filter(User.email == staff_in.email.lower().strip()).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        email=staff_in.email.lower().strip(),
        hashed_password=get_password_hash(staff_in.password),
        full_name=staff_in.full_name.strip(),
        role=staff_in.role,
        business_id=current_user.business_id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return StaffMemberResponse(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role,
        is_active=new_user.is_active,
    )

@router.post("/feedback", response_model=FeedbackResponse)
def submit_customer_feedback(fb_in: FeedbackCreate, db: Session = Depends(get_db)):
    business_id = ensure_demo_dashboard_seed(db)
    fb = CustomerFeedback(
        business_id=business_id,
        module=fb_in.module,
        guest_name=fb_in.guest_name.strip(),
        rating=fb_in.rating,
        comment=fb_in.comment.strip(),
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return FeedbackResponse(
        id=fb.id,
        module=fb.module,
        guest_name=fb.guest_name,
        rating=fb.rating,
        comment=fb.comment,
        created_at="Just now",
    )

@router.get("/export-csv/{report_type}")
def export_protected_csv(
    report_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["owner", "manager"]:
        raise HTTPException(status_code=403, detail="CSV export restricted to Owner and Manager roles")

    business_id = current_user.business_id
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "bookings":
        writer.writerow(["Reference", "Guest Name", "Phone", "Check-In", "Check-Out", "Rooms", "Total Amount", "Payment Status"])
        rows = db.query(RoomBooking).filter(RoomBooking.business_id == business_id).all()
        for r in rows:
            writer.writerow([r.booking_reference, r.guest_name, r.guest_phone, r.check_in_date, r.check_out_date, r.rooms_count, r.total_amount, r.payment_status])
    elif report_type == "orders":
        writer.writerow(["Order Ref", "Table No", "Customer Name", "Items Summary", "Total Bill", "Kitchen Status", "Payment Status"])
        rows = db.query(RestaurantOrder).filter(RestaurantOrder.business_id == business_id).all()
        for r in rows:
            writer.writerow([r.order_reference, r.table_number, r.customer_name, r.items_summary, r.order_total, r.kitchen_status, r.payment_status])
    elif report_type == "expenses":
        writer.writerow(["Category", "Title", "Amount (INR)", "Date", "Notes"])
        rows = db.query(BusinessExpense).filter(BusinessExpense.business_id == business_id).all()
        for r in rows:
            writer.writerow([r.category, r.title, r.amount, r.expense_date, r.notes or ""])
    else:
        writer.writerow(["Transaction Ref", "Module", "Source Ref", "Guest Name", "Total Bill", "Paid Now", "Balance Due", "Status"])
        rows = db.query(PaymentTransaction).filter(PaymentTransaction.business_id == business_id).all()
        for r in rows:
            writer.writerow([r.transaction_reference, r.module, r.source_reference, r.guest_name, r.total_bill_amount, r.amount_payable_now, r.balance_due, r.status])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=royal_haven_{report_type}.csv"},
    )
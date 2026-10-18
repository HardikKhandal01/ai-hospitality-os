from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import random
from typing import List

from app.db.database import get_db
from app.models.restaurant import MenuItem, RestaurantOrder
from app.api.routes.hotel import ensure_demo_hotel_inventory
from app.schemas.restaurant import (
    MenuItemResponse,
    RestaurantOrderCreate,
    RestaurantOrderResponse,
    TableRunningBillResponse,
)

router = APIRouter()

def ensure_demo_restaurant_menu(db: Session, business_id: str = "demo-business") -> str:
    actual_business_id = ensure_demo_hotel_inventory(db, business_id)
    existing = db.query(MenuItem).filter(MenuItem.business_id == actual_business_id).count()
    if existing == 0:
        sample_menu = [
            MenuItem(
                business_id=actual_business_id,
                name="Royal Paneer Tikka Angara",
                category="Starters",
                description="Charcoal-grilled cottage cheese marinated in hung curd and smoky Rajasthani spices.",
                image_url="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=True,
                allergens="Dairy",
                ingredients="Paneer, Hung Curd, Bell Peppers, Kashmiri Chilli, Mustard Oil",
                has_half_full=True,
                half_price=180.0,
                full_price=320.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Crispy Honey Chilli Lotus Stem",
                category="Starters",
                description="Crunchy lotus stem tossed in roasted sesame, honey, and mild schezwan glaze.",
                image_url="https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=False,
                allergens="Sesame, Soy",
                ingredients="Lotus Stem, Honey, Sesame Seeds, Spring Onion, Soy Glaze",
                has_half_full=True,
                half_price=160.0,
                full_price=290.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Paneer Butter Masala",
                category="Main Course",
                description="Velvety tomato and cashew gravy simmered with soft paneer cubes and white butter.",
                image_url="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=False,
                allergens="Dairy, Cashew Nuts",
                ingredients="Paneer, Tomatoes, Cashew Paste, Cream, Fenugreek Leaves",
                has_half_full=True,
                half_price=220.0,
                full_price=390.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Dal Makhani Bukhara",
                category="Main Course",
                description="Slow-cooked black lentils simmered overnight on charcoal with cream and ginger.",
                image_url="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=False,
                allergens="Dairy",
                ingredients="Black Urad Dal, Rajma, White Butter, Fresh Cream, Garlic",
                has_half_full=True,
                half_price=190.0,
                full_price=340.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Rajasthani Laal Maas (Signature)",
                category="Main Course",
                description="Traditional fiery royal mutton curry cooked with Mathania red chillies and desi ghee.",
                image_url="https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
                is_veg=False,
                is_spicy=True,
                allergens="Dairy (Ghee)",
                ingredients="Mutton, Mathania Red Chillies, Desi Ghee, Yogurt, Cloves, Garlic",
                has_half_full=True,
                half_price=360.0,
                full_price=650.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Subz Dum Handi Biryani",
                category="Breads & Rice",
                description="Fragrant basmati rice layered with seasonal vegetables, saffron, and caramelized onions.",
                image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=True,
                allergens="Dairy, Cashew & Almond",
                ingredients="Basmati Rice, Saffron, Mint, Ghee, Seasonal Vegetables",
                has_half_full=True,
                half_price=210.0,
                full_price=380.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Artisan Garlic Butter Naan",
                category="Breads & Rice",
                description="Tandoor-baked leavened flatbread topped with roasted garlic and farm butter.",
                image_url="https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=False,
                allergens="Gluten, Dairy",
                ingredients="Refined Flour, Minced Garlic, Butter, Kalonji",
                has_half_full=False,
                half_price=None,
                full_price=85.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Royal Rose & Pistachio Lassi",
                category="Drinks",
                description="Thick churned yogurt drink infused with organic rose petals and crushed pistachios.",
                image_url="https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=False,
                allergens="Dairy, Pistachio Nuts",
                ingredients="Yogurt, Rose Syrup, Pistachios, Cardamom",
                has_half_full=False,
                half_price=None,
                full_price=140.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Chilled Sparkling Cola / Fresh Lime",
                category="Drinks",
                description="Refreshing chilled beverage served with mint and ice.",
                image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=False,
                allergens="None",
                ingredients="Carbonated Water, Lemon, Mint, Ice",
                has_half_full=False,
                half_price=None,
                full_price=80.0,
            ),
            MenuItem(
                business_id=actual_business_id,
                name="Hot Kesariya Gulab Jamun (2 Pcs)",
                category="Desserts",
                description="Melt-in-mouth khoya dumplings soaked in saffron and cardamom sugar syrup.",
                image_url="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
                is_veg=True,
                is_spicy=False,
                allergens="Dairy, Gluten, Almonds",
                ingredients="Khoya, Saffron, Cardamom, Sugar Syrup, Almond Slivers",
                has_half_full=False,
                half_price=None,
                full_price=150.0,
            ),
        ]
        db.add_all(sample_menu)
        db.commit()
    return actual_business_id

def format_order_response(o: RestaurantOrder) -> RestaurantOrderResponse:
    return RestaurantOrderResponse(
        id=o.id,
        order_reference=o.order_reference,
        table_number=o.table_number,
        customer_name=o.customer_name,
        items_summary=o.items_summary,
        order_total=o.order_total,
        kitchen_status=o.kitchen_status,
        payment_mode=o.payment_mode,
        payment_status=o.payment_status,
        created_at=o.created_at.strftime("%I:%M %p") if o.created_at else "Just now",
    )

@router.get("/menu", response_model=List[MenuItemResponse])
def get_restaurant_menu(business_id: str = "demo-business", db: Session = Depends(get_db)):
    actual_business_id = ensure_demo_restaurant_menu(db, business_id)
    return (
        db.query(MenuItem)
        .filter(MenuItem.business_id == actual_business_id, MenuItem.is_available == True)
        .all()
    )

@router.post("/orders", response_model=RestaurantOrderResponse)
def create_table_order(order_in: RestaurantOrderCreate, db: Session = Depends(get_db)):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    actual_business_id = ensure_demo_restaurant_menu(db, order_in.business_id or "demo-business")

    summary_parts = []
    calculated_total = 0.0

    for item in order_in.items:
        line_total = item.unit_price * item.quantity
        calculated_total += line_total
        variant_tag = f" ({item.variant})" if item.variant in ["Half", "Full"] else ""
        summary_parts.append(f"{item.quantity}x {item.name}{variant_tag}")

    items_summary_str = ", ".join(summary_parts)
    ref = f"ORD-{random.randint(1000, 9999)}"
    is_paid_now = order_in.payment_mode == "pay_now"

    new_order = RestaurantOrder(
        order_reference=ref,
        business_id=actual_business_id,
        table_number=order_in.table_number,
        customer_name=order_in.customer_name.strip(),
        items_summary=items_summary_str,
        order_total=calculated_total,
        kitchen_status="New",
        payment_mode=order_in.payment_mode,
        payment_status="Paid" if is_paid_now else "Unpaid",
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return format_order_response(new_order)

@router.get("/tables/{table_number}/bill", response_model=TableRunningBillResponse)
def get_table_running_bill(
    table_number: int,
    business_id: str = "demo-business",
    db: Session = Depends(get_db),
):
    actual_business_id = ensure_demo_restaurant_menu(db, business_id)
    orders = (
        db.query(RestaurantOrder)
        .filter(
            RestaurantOrder.business_id == actual_business_id,
            RestaurantOrder.table_number == table_number,
        )
        .order_by(RestaurantOrder.created_at.desc())
        .all()
    )

    running_total = sum(o.order_total for o in orders)
    paid_amount = sum(o.order_total for o in orders if o.payment_status == "Paid")
    due_amount = max(0.0, running_total - paid_amount)
    latest_customer = orders[0].customer_name if orders else None

    return TableRunningBillResponse(
        table_number=table_number,
        customer_name=latest_customer,
        orders=[format_order_response(o) for o in orders],
        running_total=running_total,
        paid_amount=paid_amount,
        due_amount=due_amount,
    )

@router.post("/tables/{table_number}/settle", response_model=TableRunningBillResponse)
def settle_table_bill(
    table_number: int,
    business_id: str = "demo-business",
    db: Session = Depends(get_db),
):
    actual_business_id = ensure_demo_restaurant_menu(db, business_id)
    unpaid_orders = (
        db.query(RestaurantOrder)
        .filter(
            RestaurantOrder.business_id == actual_business_id,
            RestaurantOrder.table_number == table_number,
            RestaurantOrder.payment_status == "Unpaid",
        )
        .all()
    )
    for o in unpaid_orders:
        o.payment_status = "Paid"
    db.commit()
    return get_table_running_bill(table_number, business_id, db)

@router.get("/kitchen/orders", response_model=List[RestaurantOrderResponse])
def get_kitchen_orders(business_id: str = "demo-business", db: Session = Depends(get_db)):
    actual_business_id = ensure_demo_restaurant_menu(db, business_id)
    orders = (
        db.query(RestaurantOrder)
        .filter(RestaurantOrder.business_id == actual_business_id)
        .order_by(RestaurantOrder.created_at.desc())
        .limit(30)
        .all()
    )
    return [format_order_response(o) for o in orders]

@router.patch("/kitchen/orders/{order_id}/status", response_model=RestaurantOrderResponse)
def update_kitchen_order_status(
    order_id: str,
    status: str,
    db: Session = Depends(get_db),
):
    order = db.query(RestaurantOrder).filter(RestaurantOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.kitchen_status = status
    db.commit()
    db.refresh(order)
    return format_order_response(order)
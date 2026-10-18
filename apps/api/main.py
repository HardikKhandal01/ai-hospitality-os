from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time
from collections import defaultdict
import os
from app.db.database import engine, Base
from app.models import business, user, ai_chat, hotel, restaurant, payment, operations, dashboard
from app.api.routes import (
    auth,
    ai_chat as ai_chat_route,
    hotel as hotel_route,
    restaurant as restaurant_route,
    payments as payments_route,
    operations as operations_route,
    dashboard as dashboard_route,
    security as security_route,
)

# Automatically create all tables in PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Hospitality OS API — Enterprise V2")

# Security Point #6: Sliding-Window Per-IP Rate Limiter
RATE_LIMIT_STORE = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 120

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Clean requests older than 60 seconds
    RATE_LIMIT_STORE[client_ip] = [t for t in RATE_LIMIT_STORE[client_ip] if now - t < 60]

    if len(RATE_LIMIT_STORE[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Rate limit exceeded. Please wait a moment."},
        )

    RATE_LIMIT_STORE[client_ip].append(now)
    response = await call_next(request)

    # Security Points #2, #3, #17: Enterprise HTTP Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=()"
    return response

# Security Point #11: Strictly Controlled CORS (Updated for Vercel & Localhost)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins_list = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Connect All 7 Modular Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ai_chat_route.router, prefix="/api/ai", tags=["AI Receptionist"])
app.include_router(hotel_route.router, prefix="/api/hotel", tags=["Hotel Booking Engine"])
app.include_router(restaurant_route.router, prefix="/api/restaurant", tags=["Restaurant & Kitchen Engine"])
app.include_router(payments_route.router, prefix="/api/payments", tags=["Payments & Financial Records"])
app.include_router(operations_route.router, prefix="/api/operations", tags=["Calendar & Notifications"])
app.include_router(dashboard_route.router, prefix="/api/dashboard", tags=["Owner Command Center & Analytics"])
app.include_router(security_route.router, prefix="/api/security", tags=["20-Point Security Audit"])

@app.get("/")
def read_root():
    return {"status": "Secure AI Hospitality OS Backend (All 12 Phases Active) is Running"}
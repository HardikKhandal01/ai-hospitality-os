"use client";
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Utensils,
  Users,
  Bot,
  Download,
  Plus,
  Star,
  ShieldCheck,
  Lock,
  LogOut,
  CheckCircle2,
  PhoneCall,
  ArrowLeft,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

const DEMO_ROLES = [
  { label: "👑 Owner (Full Access + P&L + Staff)", email: "owner@royalhaven.com", role: "owner" },
  { label: "📊 General Manager (Operations + P&L)", email: "manager@royalhaven.com", role: "manager" },
  { label: "🛎️ Receptionist (Bookings & Guests)", email: "reception@royalhaven.com", role: "receptionist" },
  { label: "👨‍🍳 Head Chef (Kitchen Orders Only)", email: "kitchen@royalhaven.com", role: "kitchen" },
  { label: "🧹 Housekeeping (Room Service Tasks)", email: "housekeeping@royalhaven.com", role: "housekeeping" },
];

export default function OwnerDashboardPage() {
  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    role: string;
    business: string;
  } | null>(null);

  const [email, setEmail] = useState("owner@royalhaven.com");
  const [password, setPassword] = useState("Royal@2026");
  const [loginError, setLoginError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data State
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "hotel" | "restaurant" | "expenses" | "staff">("overview");
  const [statusMsg, setStatusMsg] = useState("");

  // Expense Form State
  const [expCategory, setExpCategory] = useState("Food Costs");
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");

  // Staff Creation Form State
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("receptionist");

  // Feedback Form State
  const [fbName, setFbName] = useState("");
  const [fbModule, setFbModule] = useState("hotel");
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState("");

  const fetchOverview = async (jwtToken: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/overview", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {}
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem("hospitality_os_jwt");
    const savedUser = sessionStorage.getItem("hospitality_os_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUserInfo(JSON.parse(savedUser));
      fetchOverview(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setAuthLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setLoginError(result.detail || "Authentication failed");
      } else {
        const info = {
          name: result.user_name,
          email: result.user_email,
          role: result.role,
          business: result.business_name,
        };
        sessionStorage.setItem("hospitality_os_jwt", result.access_token);
        sessionStorage.setItem("hospitality_os_user", JSON.stringify(info));
        setToken(result.access_token);
        setUserInfo(info);
        fetchOverview(result.access_token);
      }
    } catch (err) {
      setLoginError("Backend server unreachable. Make sure FastAPI is running on port 8000.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("hospitality_os_jwt");
    sessionStorage.removeItem("hospitality_os_user");
    setToken(null);
    setUserInfo(null);
    setData(null);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !expTitle || !expAmount) return;
    const res = await fetch("http://127.0.0.1:8000/api/dashboard/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        category: expCategory,
        title: expTitle,
        amount: Number(expAmount),
      }),
    });
    if (res.ok) {
      setExpTitle("");
      setExpAmount("");
      setStatusMsg("✅ Expense recorded & Net Profit recalculated!");
      fetchOverview(token);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !staffEmail || !staffPassword) return;
    const res = await fetch("http://127.0.0.1:8000/api/dashboard/staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        full_name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
      }),
    });
    if (res.ok) {
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setStatusMsg("✅ New RBAC Staff Member created with Bcrypt hashed password!");
      fetchOverview(token);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName || !fbComment) return;
    const res = await fetch("http://127.0.0.1:8000/api/dashboard/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: fbModule,
        guest_name: fbName,
        rating: Number(fbRating),
        comment: fbComment,
      }),
    });
    if (res.ok) {
      setFbName("");
      setFbComment("");
      setStatusMsg("⭐ Guest Feedback added to average rating!");
      if (token) fetchOverview(token);
    }
  };

  const downloadCSV = async (reportType: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/dashboard/export-csv/${reportType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("CSV Export is restricted to Owner and Manager roles only!");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `royal_haven_${reportType}.csv`;
      a.click();
    } catch (err) {}
  };

  // =========================================================================
  // VIEW 1: PASSWORD-PROTECTED CLIENT / MANAGER LOGIN GATE
  // =========================================================================
  if (!token || !userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-royal/80 to-navy flex items-center justify-center px-4 py-12 pb-32">
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border-2 border-champagne/70">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-navy text-champagne rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock size={30} />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-success bg-success/10 px-3 py-1 rounded-full">
              ● Bcrypt + JWT Role-Based Security
            </span>
            <h1 className="text-2xl font-extrabold text-navy mt-2">
              Hospitality Command Center
            </h1>
            <p className="text-xs text-charcoal/60 mt-1">
              Sign in with your Owner, Manager, or Staff credentials
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4">
              {loginError}
            </div>
          )}

          {/* Quick Role Switcher for Demo / Sales Pitch */}
          <div className="mb-5">
            <label className="text-[11px] font-bold uppercase text-charcoal/70 block mb-1.5">
              Quick Demo Role Selector (Auto-Fill)
            </label>
            <select
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPassword("Royal@2026");
              }}
              className="w-full px-3.5 py-2.5 border border-champagne rounded-xl text-xs font-bold text-navy bg-ivory"
            >
              {DEMO_ROLES.map((r) => (
                <option key={r.email} value={r.email}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-charcoal/70 uppercase">
                Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border rounded-xl text-sm text-navy font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-charcoal/70 uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border rounded-xl text-sm text-navy font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-navy hover:bg-royal text-champagne hover:text-white font-extrabold py-3.5 rounded-xl transition shadow-lg text-sm cursor-pointer"
            >
              {authLoading ? "Verifying Credentials..." : "Unlock Command Center →"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs text-royal font-bold hover:underline">
              ← Back to Public Hospitality OS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED OWNER / MANAGER COMMAND CENTER
  // =========================================================================
  const canViewFinancials = userInfo.role === "owner" || userInfo.role === "manager";

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-royal/80 to-navy text-charcoal px-4 pt-8 pb-36">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Command Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-champagne text-sm font-medium hover:underline mb-1"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Hospitality OS
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                {userInfo.business} <span className="text-champagne">Command Center</span>
              </h1>
              <span className="bg-champagne text-navy text-xs font-extrabold uppercase px-3 py-1 rounded-full">
                Role: {userInfo.role}
              </span>
            </div>
            <p className="text-xs text-ivory/80 mt-1">
              Logged in as <strong>{userInfo.name}</strong> ({userInfo.email})
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            {canViewFinancials && (
              <button
                onClick={() => downloadCSV("bookings")}
                className="bg-white/15 hover:bg-champagne text-white hover:text-navy px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <Download size={15} /> Export CSV
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-red-400/40 cursor-pointer"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-success/25 border border-success text-white px-5 py-3 rounded-2xl mb-6 text-xs font-bold flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {[
            { id: "overview", label: "📊 P&L & Executive Overview" },
            { id: "hotel", label: "🏨 Hotel Bookings & Room Service" },
            { id: "restaurant", label: "🍽️ Restaurant Orders & Bills" },
            { id: "expenses", label: "💰 Expenses & Net Profit Calculator" },
            { id: "staff", label: "👥 Staff Roles & Guest Reviews" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-champagne text-navy shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!data ? (
          <div className="bg-white/95 rounded-3xl p-12 text-center font-bold">
            Loading real-time hospitality analytics...
          </div>
        ) : (
          <>
            {/* =================================================================
                TAB 1: EXECUTIVE OVERVIEW & REAL PROFIT / LOSS ANALYTICS
               ================================================================= */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Top 4 Financial & Occupancy Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white rounded-3xl p-6 shadow-xl border-b-4 border-royal">
                    <div className="flex items-center justify-between text-xs font-bold text-charcoal/60 uppercase">
                      <span>Total Gross Revenue</span>
                      <TrendingUp className="text-royal" size={18} />
                    </div>
                    <p className="text-3xl font-extrabold text-navy mt-2">
                      {canViewFinancials ? `₹${data.total_revenue.toLocaleString("en-IN")}` : "Restricted"}
                    </p>
                    <p className="text-[11px] text-charcoal/60 mt-1">
                      Hotel: ₹{data.hotel_revenue} • Dining: ₹{data.restaurant_revenue}
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-xl border-b-4 border-amber-500">
                    <div className="flex items-center justify-between text-xs font-bold text-charcoal/60 uppercase">
                      <span>Recorded Expenses</span>
                      <TrendingDown className="text-amber-600" size={18} />
                    </div>
                    <p className="text-3xl font-extrabold text-navy mt-2">
                      {canViewFinancials ? `₹${data.total_expenses.toLocaleString("en-IN")}` : "Restricted"}
                    </p>
                    <p className="text-[11px] text-charcoal/60 mt-1">
                      Salaries, Food Costs, Utilities & Maintenance
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-xl border-b-4 border-success">
                    <div className="flex items-center justify-between text-xs font-bold text-charcoal/60 uppercase">
                      <span>Estimated Net Profit</span>
                      <DollarSign className="text-success" size={18} />
                    </div>
                    <p
                      className={`text-3xl font-extrabold mt-2 ${
                        data.estimated_net_profit >= 0 ? "text-success" : "text-red-600"
                      }`}
                    >
                      {canViewFinancials
                        ? `₹${data.estimated_net_profit.toLocaleString("en-IN")}`
                        : "Restricted"}
                    </p>
                    <p className="text-[11px] text-charcoal/60 mt-1">
                      Actual Revenue minus Verified Expenses
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-xl border-b-4 border-champagne">
                    <div className="flex items-center justify-between text-xs font-bold text-charcoal/60 uppercase">
                      <span>Room Occupancy</span>
                      <Building2 className="text-champagne" size={18} />
                    </div>
                    <p className="text-3xl font-extrabold text-navy mt-2">
                      {data.occupied_rooms}/{data.total_rooms_inventory}{" "}
                      <span className="text-lg text-royal">({data.occupancy_rate}%)</span>
                    </p>
                    <p className="text-[11px] text-charcoal/60 mt-1">
                      {data.group_banquet_count} Wedding / Banquet Blocks Active
                    </p>
                  </div>
                </div>

                {/* Second Row: Operations Counters + AI Usage + CSV Center */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Live Operations Pulse */}
                  <div className="bg-white/95 rounded-3xl p-6 shadow-xl space-y-3">
                    <h3 className="text-base font-extrabold text-navy flex items-center gap-2">
                      <LayoutDashboard className="text-royal" size={19} /> Live Operations Pulse
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2.5 bg-ivory rounded-xl">
                        <span>Total Room Bookings:</span>
                        <strong className="text-navy">{data.total_bookings}</strong>
                      </div>
                      <div className="flex justify-between p-2.5 bg-ivory rounded-xl">
                        <span>Restaurant Table Orders:</span>
                        <strong className="text-navy">{data.total_restaurant_orders}</strong>
                      </div>
                      <div className="flex justify-between p-2.5 bg-ivory rounded-xl">
                        <span>Pending Kitchen Orders:</span>
                        <strong className="text-amber-700">{data.pending_kitchen_orders}</strong>
                      </div>
                      <div className="flex justify-between p-2.5 bg-ivory rounded-xl">
                        <span>Pending Room Service:</span>
                        <strong className="text-royal">{data.pending_room_service}</strong>
                      </div>
                      <div className="flex justify-between p-2.5 bg-ivory rounded-xl">
                        <span>Morning Manager Callbacks:</span>
                        <strong className="text-success">{data.scheduled_callbacks}</strong>
                      </div>
                    </div>
                  </div>

                  {/* AI Usage & 4-Key Fallback Monitor */}
                  <div className="bg-white/95 rounded-3xl p-6 shadow-xl space-y-3">
                    <h3 className="text-base font-extrabold text-navy flex items-center gap-2">
                      <Bot className="text-champagne" size={19} /> AI Receptionist & 4-Key Health
                    </h3>
                    <div className="p-4 bg-navy text-white rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-ivory/70">Active AI Personas:</span>
                        <span className="font-bold text-champagne">Aaradhya & Vivaan</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ivory/70">Configured Fallback Keys:</span>
                        <span className="font-bold text-success">{data.configured_ai_keys} / 4 Keys Ready</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ivory/70">Total Tenant AI Requests:</span>
                        <span className="font-extrabold text-white">{data.total_ai_requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ivory/70">Unrecovered Failures:</span>
                        <span className="font-bold text-champagne">{data.failed_ai_requests}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="font-bold text-navy flex items-center gap-1">
                        <Star className="text-amber-500 fill-amber-500" size={15} /> Guest Rating:
                      </span>
                      <span className="font-extrabold text-navy">
                        {data.average_rating} / 5.0 ({data.total_reviews} Reviews)
                      </span>
                    </div>
                  </div>

                  {/* Protected CSV Data Exports */}
                  <div className="bg-white/95 rounded-3xl p-6 shadow-xl space-y-3">
                    <h3 className="text-base font-extrabold text-navy flex items-center gap-2">
                      <Download className="text-success" size={19} /> Access-Controlled CSV Exports
                    </h3>
                    <p className="text-xs text-charcoal/65">
                      Download verified spreadsheets for accounting, GST reconciliation, and audit logs.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      {[
                        { id: "bookings", label: "🏨 Room Bookings" },
                        { id: "orders", label: "🍽️ Table Orders" },
                        { id: "expenses", label: "📉 P&L Expenses" },
                        { id: "payments", label: "💳 Payment Ledger" },
                      ].map((rep) => (
                        <button
                          key={rep.id}
                          onClick={() => downloadCSV(rep.id)}
                          className="p-3 rounded-xl bg-ivory hover:bg-navy text-navy hover:text-champagne font-bold text-xs transition border border-gray-200 text-left cursor-pointer"
                        >
                          {rep.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 2: HOTEL BOOKINGS, ROOM SERVICE & MANAGER CALLBACKS
               ================================================================= */}
            {activeTab === "hotel" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-extrabold text-navy mb-4">
                    Recent Room Bookings ({data.recent_bookings.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {data.recent_bookings.map((b: any) => (
                      <div key={b.id} className="p-3.5 bg-ivory rounded-2xl border text-xs flex justify-between items-center">
                        <div>
                          <span className="font-extrabold text-navy">{b.reference} — {b.guest_name}</span>
                          <p className="text-charcoal/70">{b.check_in} to {b.check_out} • {b.rooms} Room(s)</p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-royal block">₹{b.amount}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-success/15 text-success">
                            {b.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-xl">
                    <h3 className="text-lg font-extrabold text-navy mb-3">
                      Room Service & Housekeeping Requests ({data.recent_room_service.length})
                    </h3>
                    <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                      {data.recent_room_service.map((r: any) => (
                        <div key={r.id} className="p-3 bg-ivory rounded-xl text-xs flex justify-between">
                          <div>
                            <strong className="text-navy">Room {r.room_number} ({r.reference})</strong>
                            <p className="text-charcoal/75">{r.items}</p>
                          </div>
                          <span className="font-bold text-royal">{r.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-xl">
                    <h3 className="text-lg font-extrabold text-navy mb-3 flex items-center gap-2">
                      <PhoneCall size={18} className="text-success" /> Scheduled Manager Callbacks ({data.recent_callbacks.length})
                    </h3>
                    <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                      {data.recent_callbacks.map((c: any) => (
                        <div key={c.id} className="p-3 bg-ivory rounded-xl text-xs flex justify-between">
                          <div>
                            <strong className="text-navy">{c.guest_name} ({c.guest_phone})</strong>
                            <p className="text-charcoal/70">{c.preferred_time} — {c.reason}</p>
                          </div>
                          <span className="font-bold text-success">{c.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 3: RESTAURANT ORDERS & RUNNING TABLE BILLS
               ================================================================= */}
            {activeTab === "restaurant" && (
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-extrabold text-navy mb-4">
                  Live Restaurant Table Orders ({data.recent_orders.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {data.recent_orders.map((o: any) => (
                    <div key={o.id} className="p-4 bg-ivory rounded-2xl border border-gray-200 text-xs space-y-1.5">
                      <div className="flex justify-between font-extrabold text-navy text-sm">
                        <span>Table #{o.table_number} — {o.customer_name}</span>
                        <span className="text-royal">₹{o.amount}</span>
                      </div>
                      <p className="text-charcoal/80 font-medium">{o.items}</p>
                      <div className="flex justify-between pt-1">
                        <span className="font-bold text-charcoal/60">Ref: {o.reference} • Kitchen: {o.kitchen_status}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${o.payment_status === "Paid" ? "bg-success/15 text-success" : "bg-amber-500/20 text-amber-900"}`}>
                          {o.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 4: EXPENSES & REAL PROFIT/LOSS CALCULATOR
               ================================================================= */}
            {activeTab === "expenses" && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl self-start">
                  <h3 className="text-lg font-extrabold text-navy mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-royal" /> Record Business Expense
                  </h3>
                  <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-bold text-charcoal/70 uppercase">Expense Category</label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 border rounded-xl bg-ivory font-semibold"
                      >
                        <option value="Salaries">Salaries & Payroll</option>
                        <option value="Food Costs">Food & Kitchen Raw Material</option>
                        <option value="Utilities">Electricity, Water & Wi-Fi</option>
                        <option value="Rent">Property Lease / Rent</option>
                        <option value="Maintenance">AC, Pool & Room Maintenance</option>
                        <option value="Marketing">Marketing & Promotions</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-charcoal/70 uppercase">Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly Kitchen Gas & Dairy Bill"
                        value={expTitle}
                        onChange={(e) => setExpTitle(e.target.value)}
                        className="w-full mt-1 px-3.5 py-2.5 border rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-charcoal/70 uppercase">Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="15000"
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        className="w-full mt-1 px-3.5 py-2.5 border rounded-xl"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-navy hover:bg-royal text-champagne hover:text-white font-bold py-3 rounded-xl transition cursor-pointer"
                    >
                      Save Expense & Update Net Profit
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-extrabold text-navy mb-4">
                    Verified Expense Ledger (Total: ₹{data.total_expenses.toLocaleString("en-IN")})
                  </h3>
                  <div className="space-y-3">
                    {data.expenses.map((e: any) => (
                      <div key={e.id} className="p-4 bg-ivory rounded-2xl border flex items-center justify-between text-xs">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-navy text-champagne font-bold text-[10px] uppercase">
                            {e.category}
                          </span>
                          <p className="font-extrabold text-navy text-sm mt-1">{e.title}</p>
                          <span className="text-charcoal/60">{e.expense_date}</span>
                        </div>
                        <span className="text-base font-extrabold text-red-600">-₹{e.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 5: ROLE-BASED STAFF & CUSTOMER FEEDBACK
               ================================================================= */}
            {activeTab === "staff" && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Staff RBAC Management */}
                <div className="bg-white rounded-3xl p-6 shadow-xl space-y-5">
                  <div>
                    <h3 className="text-lg font-extrabold text-navy flex items-center gap-2">
                      <Briefcase size={19} className="text-royal" /> Role-Based Staff Accounts ({data.staff_members.length})
                    </h3>
                    <p className="text-xs text-charcoal/60">
                      Each staff member gets least-privilege access according to their role.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {data.staff_members.map((s: any) => (
                      <div key={s.id} className="p-3 bg-ivory rounded-xl border flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-navy">{s.full_name}</p>
                          <span className="text-charcoal/60">{s.email}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-navy text-champagne font-bold uppercase text-[10px]">
                          {s.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  {userInfo.role === "owner" && (
                    <form onSubmit={handleAddStaff} className="pt-4 border-t space-y-3 text-xs">
                      <h4 className="font-extrabold text-navy">Add New Staff Login</h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          className="px-3 py-2 border rounded-xl"
                          required
                        />
                        <select
                          value={staffRole}
                          onChange={(e) => setStaffRole(e.target.value)}
                          className="px-3 py-2 border rounded-xl bg-ivory font-bold"
                        >
                          <option value="manager">Manager</option>
                          <option value="receptionist">Receptionist</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="housekeeping">Housekeeping</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="email"
                          placeholder="staff@royalhaven.com"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          className="px-3 py-2 border rounded-xl"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Strong Password"
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                          className="px-3 py-2 border rounded-xl"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-navy text-champagne font-bold py-2.5 rounded-xl cursor-pointer"
                      >
                        Create Staff Account
                      </button>
                    </form>
                  )}
                </div>

                {/* Guest Feedback & Ratings */}
                <div className="bg-white rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-navy flex items-center gap-2">
                      <Star className="text-amber-500 fill-amber-500" size={19} /> Verified Guest Reviews
                    </h3>
                    <span className="text-sm font-extrabold text-navy bg-amber-500/20 px-3 py-1 rounded-full">
                      {data.average_rating} ★ Avg
                    </span>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {data.feedbacks.map((f: any) => (
                      <div key={f.id} className="p-3.5 bg-ivory rounded-2xl border text-xs space-y-1">
                        <div className="flex justify-between font-bold text-navy">
                          <span>{f.guest_name} ({f.module.toUpperCase()})</span>
                          <span className="text-amber-600">{"★".repeat(f.rating)}</span>
                        </div>
                        <p className="text-charcoal/80">{f.comment}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddFeedback} className="pt-4 border-t space-y-3 text-xs">
                    <h4 className="font-extrabold text-navy">Log Post-Checkout / Table Review</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Guest Name"
                        value={fbName}
                        onChange={(e) => setFbName(e.target.value)}
                        className="px-3 py-2 border rounded-xl"
                        required
                      />
                      <select
                        value={fbModule}
                        onChange={(e) => setFbModule(e.target.value)}
                        className="px-3 py-2 border rounded-xl bg-ivory"
                      >
                        <option value="hotel">Hotel Stay</option>
                        <option value="restaurant">Restaurant</option>
                      </select>
                      <select
                        value={fbRating}
                        onChange={(e) => setFbRating(Number(e.target.value))}
                        className="px-3 py-2 border rounded-xl bg-ivory font-bold"
                      >
                        <option value={5}>5 ★ Excellent</option>
                        <option value={4}>4 ★ Good</option>
                        <option value={3}>3 ★ Average</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Guest feedback comment..."
                      value={fbComment}
                      onChange={(e) => setFbComment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-royal text-white font-bold py-2.5 rounded-xl cursor-pointer"
                    >
                      Save Guest Review
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
"use client";
import React, { useEffect, useState } from "react";
import {
  Calendar,
  Bell,
  MessageSquare,
  Mail,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Clock,
  Users,
  Phone,
  Zap,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface CalendarEventItem {
  id: string;
  source_reference: string;
  event_type: string;
  title: string;
  guest_name: string;
  guest_phone: string;
  guests_count: number;
  start_date: string;
  end_date: string;
  time_slot: string;
  purpose: string;
  notes: string;
  status: string;
  google_calendar_url: string;
}

interface NotificationItem {
  id: string;
  source_reference: string;
  channel: string;
  recipient_role: string;
  recipient_address: string;
  message_body: string;
  delivery_status: string;
  retry_count: number;
  created_at: string;
  whatsapp_deeplink: string;
}

export default function LiveDemoOperationsPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/operations/overview");
      const data = await res.json();
      if (data.calendar_events) setEvents(data.calendar_events);
      if (data.notifications) setNotifications(data.notifications);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  const trigger230AMDemo = async () => {
    setSimulating(true);
    setBannerMsg("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/operations/simulate-230am-demo", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(data.calendar_events || []);
        setNotifications(data.notifications || []);
        setBannerMsg(
          "⚡ 2:30 AM Killer Demo Executed! Room Booked + Room 204 Water Dispatched + 10 AM Manager Call Scheduled + Table #12 Order Sent!"
        );
      }
    } catch (err) {
    } finally {
      setSimulating(false);
    }
  };

  const retryDispatch = async (id: string) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/operations/notifications/${id}/retry`,
        { method: "POST" }
      );
      if (res.ok) {
        fetchOperations();
      }
    } catch (err) {}
  };

  const roles = ["All", "Customer", "Hotel Owner", "Kitchen", "Housekeeping"];
  const filteredNotifications =
    roleFilter === "All"
      ? notifications
      : notifications.filter((n) => n.recipient_role === roleFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-royal/80 to-navy text-charcoal px-4 pt-8 pb-36">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-champagne text-sm font-medium hover:underline mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Hospitality OS
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Calendar & <span className="text-champagne">WhatsApp Hub</span>
            </h1>
            <p className="text-ivory/80 text-sm md:text-base mt-1">
              Google Calendar Event Sync • Real-Time WhatsApp & Email Dispatch • 2:30 AM Sales Demo Simulator
            </p>
          </div>

          <button
            onClick={trigger230AMDemo}
            disabled={simulating}
            className="bg-champagne hover:bg-white text-navy font-extrabold px-6 py-3.5 rounded-2xl shadow-2xl shadow-champagne/30 transition flex items-center gap-2 text-sm cursor-pointer self-start"
          >
            <Zap size={18} />
            {simulating ? "Simulating 2:30 AM Flow..." : "Run 2:30 AM Killer Sales Demo"}
          </button>
        </div>

        {bannerMsg && (
          <div className="bg-success/25 border border-success text-white px-5 py-3.5 rounded-2xl mb-8 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-champagne shrink-0" /> {bannerMsg}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* =====================================================================
              LEFT COLUMN: MASTER HOSPITALITY & GOOGLE CALENDAR SYNC
             ===================================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Calendar className="text-champagne" size={22} /> Master Booking & Callback Calendar ({events.length})
              </h2>
              <button
                onClick={fetchOperations}
                className="text-xs text-champagne hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={13} /> Sync Now
              </button>
            </div>

            {loading ? (
              <div className="bg-white/90 rounded-3xl p-8 text-center">Loading calendar events...</div>
            ) : events.length === 0 ? (
              <div className="bg-white/95 rounded-3xl p-8 text-center text-charcoal/70 text-sm">
                No calendar events yet. Click <strong>&quot;Run 2:30 AM Killer Sales Demo&quot;</strong> above or book a room!
              </div>
            ) : (
              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white/95 rounded-3xl p-5 shadow-xl border-l-4 border-champagne space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-navy text-champagne">
                          {ev.event_type} • {ev.source_reference}
                        </span>
                        <h3 className="text-base font-extrabold text-navy mt-1.5">
                          {ev.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-success/15 text-success shrink-0">
                        {ev.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-charcoal/80 bg-ivory p-3 rounded-2xl border border-gray-200">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-royal shrink-0" />
                        <span className="truncate">{ev.start_date} → {ev.end_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-royal shrink-0" />
                        <span>{ev.guests_count} Guests ({ev.purpose})</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Phone size={14} className="text-success shrink-0" />
                        <span>Guest Phone: <strong>{ev.guest_phone}</strong> • Slot: {ev.time_slot}</span>
                      </div>
                    </div>

                    {ev.notes && (
                      <p className="text-xs text-charcoal/70 font-medium">{ev.notes}</p>
                    )}

                    <div className="pt-2 flex items-center justify-end">
                      <a
                        href={ev.google_calendar_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-royal hover:bg-navy text-white px-4 py-2 rounded-xl transition shadow-sm"
                      >
                        <ExternalLink size={13} /> Add to Google Calendar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =====================================================================
              RIGHT COLUMN: REAL-TIME WHATSAPP & EMAIL NOTIFICATION FEED
             ===================================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Bell className="text-champagne" size={22} /> Live WhatsApp & Email Dispatches ({filteredNotifications.length})
              </h2>
            </div>

            {/* Recipient Role Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                    roleFilter === r
                      ? "bg-champagne text-navy shadow-md"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-white/90 rounded-3xl p-8 text-center">Loading notification stream...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white/95 rounded-3xl p-8 text-center text-charcoal/70 text-sm">
                No notifications for this filter yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-white/95 rounded-3xl p-5 shadow-xl border border-white/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                            notif.channel === "WhatsApp"
                              ? "bg-success text-white"
                              : "bg-royal text-white"
                          }`}
                        >
                          {notif.channel === "WhatsApp" ? (
                            <MessageSquare size={12} />
                          ) : (
                            <Mail size={12} />
                          )}
                          {notif.channel}
                        </span>
                        <span className="text-xs font-extrabold text-navy bg-champagne/25 px-2.5 py-1 rounded-full">
                          To: {notif.recipient_role}
                        </span>
                      </div>
                      <span className="text-[11px] text-charcoal/60 font-semibold">
                        {notif.created_at}
                      </span>
                    </div>

                    {/* WhatsApp-style Message Bubble */}
                    <div className="bg-[#ECF8F3] border border-success/30 rounded-2xl p-3.5 text-xs text-charcoal whitespace-pre-line font-medium leading-relaxed">
                      {notif.message_body}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="text-success font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} /> {notif.delivery_status}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => retryDispatch(notif.id)}
                          className="px-3 py-1.5 rounded-xl bg-ivory hover:bg-gray-200 text-navy font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={12} /> Retry ({notif.retry_count})
                        </button>
                        {notif.channel === "WhatsApp" && (
                          <a
                            href={notif.whatsapp_deeplink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-success hover:bg-success/90 text-white font-bold transition flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Open WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
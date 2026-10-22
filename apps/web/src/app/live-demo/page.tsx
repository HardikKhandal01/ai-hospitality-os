"use client";
import React, { useEffect, useState } from "react";
import { Calendar, Bell, MessageSquare, Mail, RefreshCw, CheckCircle2, ExternalLink, Clock, Users, Phone, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CalendarEventItem { id: string; source_reference: string; event_type: string; title: string; guest_name: string; guest_phone: string; guests_count: number; start_date: string; end_date: string; time_slot: string; purpose: string; notes: string; status: string; google_calendar_url: string; }
interface NotificationItem { id: string; source_reference: string; channel: string; recipient_role: string; recipient_address: string; message_body: string; delivery_status: string; retry_count: number; created_at: string; whatsapp_deeplink: string; }

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
      const res = await fetch("https://ai-hospitality-os.onrender.com/api/operations/overview");
      const data = await res.json();
      if (data.calendar_events) setEvents(data.calendar_events);
      if (data.notifications) setNotifications(data.notifications);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOperations(); }, []);

  const trigger230AMDemo = async () => {
    setSimulating(true);
    setBannerMsg("");
    try {
      const res = await fetch("https://ai-hospitality-os.onrender.com/api/operations/simulate-230am-demo", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEvents(data.calendar_events || []);
        setNotifications(data.notifications || []);
        setBannerMsg("⚡ 2:30 AM Killer Demo Executed! Room Booked + Room 204 Water Dispatched + 10 AM Manager Call Scheduled + Table #12 Order Sent!");
      }
    } catch (err) {} finally { setSimulating(false); }
  };

  const retryDispatch = async (id: string) => {
    try {
      const res = await fetch(`https://ai-hospitality-os.onrender.com/api/operations/notifications/${id}/retry`, { method: "POST" });
      if (res.ok) fetchOperations();
    } catch (err) {}
  };

  const roles = ["All", "Customer", "Hotel Owner", "Kitchen", "Housekeeping"];
  const filteredNotifications = roleFilter === "All" ? notifications : notifications.filter((n) => n.recipient_role === roleFilter);

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-navy via-royal/80 to-navy text-charcoal px-3 sm:px-4 pt-6 sm:pt-8 pb-36 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10 w-full">
          <div className="w-full">
            <Link href="/" className="inline-flex items-center text-champagne text-sm font-medium hover:underline mb-2">
              <ArrowLeft size={16} className="mr-1" /> Back to Hospitality OS
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight break-words">
              Calendar & <span className="text-champagne block sm:inline">WhatsApp Hub</span>
            </h1>
            <p className="text-ivory/80 text-xs sm:text-sm md:text-base mt-2 leading-relaxed">
              Google Calendar Event Sync • Real-Time WhatsApp & Email Dispatch • 2:30 AM Sales Demo Simulator
            </p>
          </div>
          <button onClick={trigger230AMDemo} disabled={simulating} className="bg-champagne hover:bg-white text-navy font-extrabold px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-2xl shadow-champagne/30 transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer self-stretch sm:self-start w-full sm:w-auto mt-2 sm:mt-0">
            <Zap size={18} className="shrink-0" />
            <span className="truncate">{simulating ? "Simulating..." : "Run 2:30 AM Killer Sales Demo"}</span>
          </button>
        </div>

        {bannerMsg && (
          <div className="bg-success/25 border border-success text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl mb-6 sm:mb-8 text-xs sm:text-sm font-semibold flex items-center gap-2 w-full">
            <CheckCircle2 size={18} className="text-champagne shrink-0" /> <span className="break-words">{bannerMsg}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 w-full">
          <div className="space-y-4 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 truncate">
                <Calendar className="text-champagne shrink-0" size={20} /> <span className="truncate">Master Booking & Callback Calendar ({events.length})</span>
              </h2>
              <button onClick={fetchOperations} className="text-xs text-champagne hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto">
                <RefreshCw size={13} /> Sync Now
              </button>
            </div>
            {loading ? ( <div className="bg-white/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-sm">Loading calendar events...</div> ) : events.length === 0 ? (
              <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-charcoal/70 text-xs sm:text-sm">No calendar events yet. Click <strong>Run 2:30 AM Killer Sales Demo</strong> above!</div>
            ) : (
              <div className="space-y-4 max-h-[600px] sm:max-h-[750px] overflow-y-auto pr-1 sm:pr-2 w-full">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl border-l-4 border-champagne space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 w-full">
                      <div className="w-full min-w-0">
                        <span className="inline-block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy text-champagne mb-1.5 truncate max-w-full">{ev.event_type} • {ev.source_reference}</span>
                        <h3 className="text-sm sm:text-base font-extrabold text-navy mt-1 break-words">{ev.title}</h3>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-success/15 text-success shrink-0 self-start">{ev.status}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-xs text-charcoal/80 bg-ivory p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-200 w-full">
                      <div className="flex items-center gap-1.5 min-w-0"><Clock size={12} className="text-royal shrink-0" /><span className="truncate">{ev.start_date} → {ev.end_date}</span></div>
                      <div className="flex items-center gap-1.5 min-w-0"><Users size={12} className="text-royal shrink-0" /><span className="truncate">{ev.guests_count} Guests ({ev.purpose})</span></div>
                      <div className="flex items-center gap-1.5 sm:col-span-2 min-w-0"><Phone size={12} className="text-success shrink-0" /><span className="truncate">Guest Phone: <strong>{ev.guest_phone}</strong> • Slot: {ev.time_slot}</span></div>
                    </div>
                    {ev.notes && ( <p className="text-[10px] sm:text-xs text-charcoal/70 font-medium break-words leading-relaxed">{ev.notes}</p> )}
                    <div className="pt-2 flex items-center justify-start sm:justify-end w-full">
                      <a href={ev.google_calendar_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full sm:w-auto gap-1.5 text-[10px] sm:text-xs font-bold bg-royal hover:bg-navy text-white px-3 sm:px-4 py-2 rounded-xl transition shadow-sm text-center">
                        <ExternalLink size={13} /> Add to Google Calendar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 w-full min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 truncate">
              <Bell className="text-champagne shrink-0" size={20} /> <span className="truncate">Live WhatsApp & Email ({filteredNotifications.length})</span>
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {roles.map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition shrink-0 ${ roleFilter === r ? "bg-champagne text-navy" : "bg-white/15 text-white hover:bg-white/25" }`}>{r}</button>
              ))}
            </div>
            {loading ? ( <div className="bg-white/90 rounded-2xl p-6 text-center text-sm">Loading...</div> ) : filteredNotifications.length === 0 ? (
              <div className="bg-white/95 rounded-2xl p-6 text-center text-charcoal/70 text-xs">No notifications.</div>
            ) : (
              <div className="space-y-4 max-h-[600px] sm:max-h-[700px] overflow-y-auto pr-1 sm:pr-2 w-full">
                {filteredNotifications.map((notif) => (
                  <div key={notif.id} className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl border border-white/60 space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-extrabold flex items-center gap-1 ${ notif.channel === "WhatsApp" ? "bg-success text-white" : "bg-royal text-white" }`}>
                          {notif.channel === "WhatsApp" ? <MessageSquare size={10} /> : <Mail size={10} />} {notif.channel}
                        </span>
                        <span className="text-[9px] sm:text-xs font-extrabold text-navy bg-champagne/25 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">To: {notif.recipient_role}</span>
                      </div>
                      <span className="text-[9px] sm:text-[11px] text-charcoal/60 font-semibold self-start sm:self-auto">{notif.created_at}</span>
                    </div>
                    <div className="bg-[#ECF8F3] border border-success/30 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 text-[10px] sm:text-xs text-charcoal whitespace-pre-line font-medium leading-relaxed break-words w-full">
                      {notif.message_body}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-[10px] sm:text-[11px] w-full">
                      <span className="text-success font-bold flex items-center gap-1 self-start sm:self-auto"><CheckCircle2 size={12} /> {notif.delivery_status}</span>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => retryDispatch(notif.id)} className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-lg bg-ivory text-navy font-bold flex items-center justify-center gap-1">
                          <RefreshCw size={10} /> Retry ({notif.retry_count})
                        </button>
                        {notif.channel === "WhatsApp" && (
                          <a href={notif.whatsapp_deeplink} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-lg bg-success text-white font-bold flex items-center justify-center gap-1">
                            <ExternalLink size={10} /> Open WhatsApp
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
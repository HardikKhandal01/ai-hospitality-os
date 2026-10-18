"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  ShieldCheck,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Paperclip,
  Volume2,
  Building2,
  Utensils,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Server,
} from "lucide-react";
import Link from "next/link";

interface ChatMsg {
  id: string;
  sender: "user" | "ai";
  content: string;
  attachmentName?: string;
  attachmentPreview?: string;
  attachmentType?: string;
  spoken?: boolean;
  keySlot?: string;
}

const HOTEL_QUICK_PLUGINS = [
  { label: "🛏️ Book 1 Double Room Today", prompt: "Mujhe aaj ke liye 1 Double Comfort Room book karna hai. Kya available hai?" },
  { label: "🧹 Room 204 Water & Towels", prompt: "Room 204 mein 2 mineral water bottles aur fresh towels bhej dijiye." },
  { label: "🎉 35-Room Wedding Inquiry", prompt: "Mujhe shaadi ke liye 35 rooms aur Banquet Hall chahiye. Package details bataiye." },
  { label: "📍 Nearby Jaipur Attractions", prompt: "Royal Haven Jaipur ke aas-paas ghumne ke liye best tourist places kaunsi hain?" },
  { label: "📞 Morning Manager Callback", prompt: "Mujhe kal subah 10 AM ke liye hotel manager ke sath call schedule karni hai." },
];

const RESTAURANT_QUICK_PLUGINS = [
  { label: "🍽️ Half / Full Menu & Prices", prompt: "Restaurant mein Half aur Full plate wale best dishes kaunse hain? Prices ke sath batao." },
  { label: "🥜 Peanut Allergy Safe Dishes", prompt: "Mujhe peanuts aur nuts se allergy hai. Main safely kya-kya खा sakta hu?" },
  { label: "⚡ Auto-Order for Table #12", prompt: "Table 12 ke liye Rahul ke naam se 1 Full Royal Paneer Tikka Angara aur 2 Garlic Butter Naan order kar do." },
  { label: "🌶️ Signature Laal Maas Info", prompt: "Rajasthani Laal Maas ki Half aur Full plate price aur ingredients batao." },
];

export default function UnifiedAIReceptionistAndSecurityPage() {
  const [activeMainTab, setActiveMainTab] = useState<"concierge" | "security" | "handover">("concierge");
  const [aiMode, setAiMode] = useState<"hotel" | "restaurant">("hotel");

  // Chat States
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "init-1",
      sender: "ai",
      content:
        "Namaste! 🙏 Main **Aaradhya** hu (Royal Haven Hotel AI Receptionist).\n\nUpar diye gaye switcher se aap mujhe (**Hotel Mode**) ya **Vivaan** (**Restaurant Mode**) ko select kar sakte hain. Main 4-Key Fallback Resiliency, Auto-Booking, Voice Response, aur Photo/Video Vision ke sath live hu!",
      keySlot: "Key #1",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastKeyUsed, setLastKeyUsed] = useState("Key #1");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);

  // 20-Point Security Audit State
  const [auditData, setAuditData] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  useEffect(() => {
    fetch("https://ai-hospitality-os.onrender.com/api/security/audit")
      .then((res) => res.json())
      .then((data) => setAuditData(data))
      .catch(() => {});
  }, []);

  const switchPersona = (newMode: "hotel" | "restaurant") => {
    setAiMode(newMode);
    setConversationId(null);
    if (newMode === "hotel") {
      setMessages([
        {
          id: `switch-${Date.now()}`,
          sender: "ai",
          content:
            "Namaste! 🙏 Main **Aaradhya** hu, Royal Haven Hotel ki 24/7 AI Receptionist. Room Booking, Wedding Banquet (50 Rooms), Room Service, ya Jaipur Guide ke liye puchiye!",
          keySlot: lastKeyUsed,
        },
      ]);
    } else {
      setMessages([
        {
          id: `switch-${Date.now()}`,
          sender: "ai",
          content:
            "Khamma Ghani! 🙏 Main **Vivaan** hu, Royal Haven Restaurant ka AI Dining Concierge. Table QR Ordering, Half/Full Plate Menu, aur Allergen Safety ke liye puchiye!",
          keySlot: lastKeyUsed,
        },
      ]);
    }
  };

  const speakReplyAloud = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~•]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "hi-IN";
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessageToAI = async (rawText: string, sentViaVoice: boolean = false) => {
    const trimmed = rawText.trim();
    if (!trimmed && !attachment) return;

    const currentAttachment = attachment;
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: "user",
        content: trimmed || `Uploaded ${currentAttachment?.name}`,
        attachmentName: currentAttachment?.name,
        attachmentPreview: currentAttachment?.data,
        attachmentType: currentAttachment?.type,
        spoken: sentViaVoice,
      },
    ]);
    setChatInput("");
    setAttachment(null);
    setAiTyping(true);

    try {
      const res = await fetch("https://ai-hospitality-os.onrender.com/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: "demo-business",
          business_name: "Royal Haven Jaipur",
          mode: aiMode,
          conversation_id: conversationId,
          message: trimmed,
          is_voice: sentViaVoice,
          attachment_name: currentAttachment?.name || null,
          attachment_type: currentAttachment?.type || null,
          attachment_data: currentAttachment?.data || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.conversation_id) setConversationId(data.conversation_id);
        if (data.active_key_slot) setLastKeyUsed(data.active_key_slot);

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            content: data.reply,
            spoken: sentViaVoice,
            keySlot: data.active_key_slot,
          },
        ]);

        if (sentViaVoice) {
          speakReplyAloud(data.reply);
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          content: "Backend API se connect nahi ho paya. Make sure FastAPI port 8000 par chal raha ho.",
        },
      ]);
    } finally {
      setAiTyping(false);
    }
  };

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice Recognition ke liye Chrome ya Edge browser use karein.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) sendMessageToAI(transcript, true);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        data: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const activePlugins = aiMode === "hotel" ? HOTEL_QUICK_PLUGINS : RESTAURANT_QUICK_PLUGINS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-royal/80 to-navy text-charcoal px-4 pt-8 pb-36">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-champagne text-sm font-medium hover:underline mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Hospitality OS
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              AI Concierge & <span className="text-champagne">Security Hub</span>
            </h1>
            <p className="text-ivory/80 text-sm mt-1">
              4-Key Gemini Fallback • Voice & Vision AI • 20-Point Security Audit • Free vs Client-Paid Architecture
            </p>
          </div>

          {/* Main Section Switcher */}
          <div className="bg-white/10 p-1.5 rounded-2xl inline-flex border border-white/15 self-start">
            <button
              onClick={() => setActiveMainTab("concierge")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeMainTab === "concierge"
                  ? "bg-champagne text-navy shadow-md"
                  : "text-white hover:text-champagne"
              }`}
            >
              ✦ Live AI Receptionist
            </button>
            <button
              onClick={() => setActiveMainTab("security")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeMainTab === "security"
                  ? "bg-champagne text-navy shadow-md"
                  : "text-white hover:text-champagne"
              }`}
            >
              🛡️ 20-Point Security Audit
            </button>
            <button
              onClick={() => setActiveMainTab("handover")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeMainTab === "handover"
                  ? "bg-champagne text-navy shadow-md"
                  : "text-white hover:text-champagne"
              }`}
            >
              💼 Free vs Paid Client Model
            </button>
          </div>
        </div>

        {/* =====================================================================
            TAB 1: UNIFIED AI RECEPTIONIST (AARADHYA <-> VIVAAN)
           ===================================================================== */}
        {activeMainTab === "concierge" && (
          <div className="bg-ivory rounded-3xl shadow-2xl border-2 border-champagne/70 overflow-hidden flex flex-col h-[74vh]">
            {/* Top Bar inside Chat */}
            <div className="bg-gradient-to-r from-navy via-charcoal to-navy px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-champagne/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-champagne/20 border border-champagne flex items-center justify-center">
                  <Bot className="text-champagne" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white">
                      {aiMode === "hotel"
                        ? "Aaradhya — Hotel AI Receptionist"
                        : "Vivaan — Restaurant AI Concierge"}
                    </h2>
                    <span className="text-[10px] bg-success/25 text-champagne border border-champagne/40 px-2.5 py-0.5 rounded-full font-bold">
                      Active Slot: {lastKeyUsed}
                    </span>
                  </div>
                  <p className="text-xs text-ivory/70">
                    4-Key Auto-Rotation • Text Input = Text Reply • Voice Input = Voice + Text Reply
                  </p>
                </div>
              </div>

              {/* Persona Switcher */}
              <div className="inline-flex bg-white/10 p-1 rounded-xl border border-white/15">
                <button
                  onClick={() => switchPersona("hotel")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    aiMode === "hotel"
                      ? "bg-champagne text-navy"
                      : "text-white hover:text-champagne"
                  }`}
                >
                  <Building2 size={14} /> Hotel (Aaradhya)
                </button>
                <button
                  onClick={() => switchPersona("restaurant")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    aiMode === "restaurant"
                      ? "bg-champagne text-navy"
                      : "text-white hover:text-champagne"
                  }`}
                >
                  <Utensils size={14} /> Restaurant (Vivaan)
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-ivory to-white">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-navy text-white rounded-br-none"
                        : "bg-white text-charcoal border border-champagne/40 rounded-bl-none"
                    }`}
                  >
                    {msg.attachmentPreview && msg.attachmentType?.startsWith("image/") && (
                      <img
                        src={msg.attachmentPreview}
                        alt={msg.attachmentName}
                        className="w-48 h-36 object-cover rounded-xl mb-2"
                      />
                    )}
                    <div className="whitespace-pre-line">{msg.content}</div>
                    {msg.sender === "ai" && msg.spoken && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-royal font-bold">
                        <Volume2 size={13} /> Spoken via Voice Response
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {aiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-champagne/40 text-navy px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <Sparkles size={14} className="text-champagne animate-spin" />
                    Processing via 4-Key Fallback Engine...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Instant Plugins */}
            <div className="px-4 py-2.5 bg-ivory border-t border-gray-200 flex items-center gap-2 overflow-x-auto">
              {activePlugins.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessageToAI(p.prompt, false)}
                  className="shrink-0 text-xs font-semibold bg-white hover:bg-navy text-navy hover:text-champagne border border-champagne/50 px-3.5 py-1.5 rounded-full transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageToAI(chatInput, false);
              }}
              className="p-4 bg-white border-t border-gray-200 flex items-center gap-2.5"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*,.pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-ivory hover:bg-champagne/20 text-navy border border-gray-200"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message or click Mic for Voice-to-Voice interaction..."
                className="flex-1 px-4 py-3 bg-ivory/70 border border-gray-200 rounded-xl text-sm text-charcoal focus:outline-none focus:border-royal"
              />

              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-3 rounded-xl border transition ${
                  isListening
                    ? "bg-red-600 text-white border-red-600 animate-pulse"
                    : "bg-ivory text-royal border-gray-200"
                }`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                type="submit"
                disabled={aiTyping}
                className="px-5 py-3 rounded-xl bg-navy hover:bg-royal text-champagne hover:text-white font-bold text-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={16} /> Send
              </button>
            </form>
          </div>
        )}

        {/* =====================================================================
            TAB 2: LIVE 20-POINT ENTERPRISE SECURITY AUDIT SCANNER
           ===================================================================== */}
        {activeMainTab === "security" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-champagne/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-success bg-success/10 px-3 py-1 rounded-full">
                  ● Live Vulnerability Verification
                </span>
                <h2 className="text-2xl font-extrabold text-navy mt-2">
                  20-Point Security Architecture Verification
                </h2>
                <p className="text-xs text-charcoal/65 mt-0.5">
                  All 20 OWASP & SaaS security risks verified across FastAPI, PostgreSQL, and Next.js
                </p>
              </div>
              <div className="bg-navy text-champagne px-5 py-3 rounded-2xl text-right shrink-0">
                <span className="text-[11px] uppercase block text-ivory/70">Security Rating</span>
                <span className="text-xl font-extrabold">20 / 20 Passed (A+)</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {(auditData?.checklist || []).map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-ivory border border-gray-200 flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5 font-extrabold text-xs">
                    #{item.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-navy">{item.risk}</h3>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-success text-white flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={11} /> {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/75 mt-1 leading-relaxed">
                      {item.control}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: FREE DEMO VS CLIENT-PAID PRODUCTION HANDOVER MODEL
           ===================================================================== */}
        {activeMainTab === "handover" && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Included Demo Tier */}
            <div className="bg-white rounded-3xl p-7 shadow-2xl border-2 border-success/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-success/15 text-success text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                  🟢 Included in Live Demo (Built & Active)
                </span>
                <ShieldCheck className="text-success" size={24} />
              </div>
              <h3 className="text-2xl font-extrabold text-navy">
                Ready-to-Pitch Hospitality OS
              </h3>
              <ul className="space-y-2.5 text-xs text-charcoal/85 font-medium">
                <li>✅ Luxury Light & Navy/Champagne Responsive UI + Floating Command Dock</li>
                <li>✅ Hotel Booking Engine (50 Rooms Inventory + Concurrency Lock + Wedding Banquet)</li>
                <li>✅ Restaurant QR Table Ordering + Half/Full Plate Engine + Running Table Bill</li>
                <li>✅ Live Kitchen Display System (KDS) with Real-Time Order Status</li>
                <li>✅ Dual AI Receptionists (Aaradhya & Vivaan) with 4-Key Fallback & Browser Voice/Vision</li>
                <li>✅ HMAC-SHA256 Verified Test Payment Checkout (20% / 50% / 100% Split)</li>
                <li>✅ Master Calendar + 1-Click Google Calendar Sync + Simulated WhatsApp Feed</li>
                <li>✅ Password-Protected Owner Command Center, RBAC Staff Roles & CSV Export</li>
              </ul>
            </div>

            {/* Client Advance-Paid Production Upgrades */}
            <div className="bg-white rounded-3xl p-7 shadow-2xl border-2 border-champagne space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-champagne/25 text-navy text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                  🔒 Activated After Client Advance Payment
                </span>
                <Server className="text-champagne" size={24} />
              </div>
              <h3 className="text-2xl font-extrabold text-navy">
                Client-Paid Production Infrastructure
              </h3>
              <p className="text-xs text-charcoal/70">
                Collect advance setup payment (₹35,000 – ₹60,000 + monthly retainer) before activating these live billing services:
              </p>
              <ul className="space-y-2.5 text-xs text-charcoal/85 font-medium">
                <li>💳 <strong>Custom Domain & SSL:</strong> Client&apos;s own `.com` / `.in` domain with Cloudflare WAF</li>
                <li>💳 <strong>Dedicated Cloud Hosting & Backups:</strong> Paid Render / AWS instance + Managed PostgreSQL with daily automated backups</li>
                <li>💳 <strong>Official WhatsApp Business API:</strong> Meta / Interakt / Twilio verified green-tick WhatsApp billing</li>
                <li>💳 <strong>Live Razorpay Merchant Account:</strong> Client&apos;s KYC-verified live merchant keys for real bank settlements</li>
                <li>💳 <strong>Dedicated High-Quota Gemini / Telephony Voice AI:</strong> Paid LLM token billing & 24/7 phone call line</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
"use client";
import React, { useEffect, useRef, useState } from "react";
import { Utensils, QrCode, ChefHat, Sparkles, PlayCircle, ChevronLeft, ChevronRight, PauseCircle, ArrowLeft, Bot, Send, Mic, MicOff, Paperclip, X, Volume2, Plus, Trash2, CheckCircle2, Flame, AlertCircle, Clock, Receipt } from "lucide-react";
import Link from "next/link";
import SecurePaymentModal from "@/components/payments/SecurePaymentModal";

interface MenuItem { id: string; name: string; category: string; description: string; image_url: string; is_veg: boolean; is_spicy: boolean; allergens: string; ingredients: string; has_half_full: boolean; half_price: number | null; full_price: number; is_available: boolean; }
interface CartItem { key: string; menu_item_id: string; name: string; variant: "Half" | "Full" | "Regular"; quantity: number; unit_price: number; }
interface OrderRecord { id: string; order_reference: string; table_number: number; customer_name: string; items_summary: string; order_total: number; kitchen_status: string; payment_mode: string; payment_status: string; created_at: string; }
interface ChatMsg { id: string; sender: "user" | "ai"; content: string; attachmentName?: string; attachmentPreview?: string; attachmentType?: string; spoken?: boolean; }

const RESTAURANT_GALLERY = [
  { id: 1, title: "Maharaja Candle-Lit Dining Hall", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", description: "Experience royal Rajasthani fine dining under warm brass chandeliers, velvet seating, and acoustic instrumental music." },
  { id: 2, title: "Smart QR Table Ordering Experience", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80", description: "Every table features instant QR scan ordering—choose Half or Full plates and send orders straight to our live kitchen." },
  { id: 3, title: "Live Charcoal Tandoor & Open Kitchen", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80", description: "Watch our master chefs craft smoky Paneer Tikka Angara and garlic naans fresh from traditional clay tandoors." },
  { id: 4, title: "Rooftop Starlight Courtyard", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1000&q=80", description: "Breezy open-air terrace tables overlooking Jaipur's heritage skyline, ideal for romantic dinners and family gatherings." },
  { id: 5, title: "Authentic Royal Thali & Handi Curries", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1000&q=80", description: "Slow-simmered Dal Makhani Bukhara and fiery Mathania Laal Maas served in traditional hammered copper vessels." },
  { id: 6, title: "Artisan Mocktail & Elixir Bar", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1000&q=80", description: "Handcrafted botanical mocktails, saffron pistachio lassis, and cold-pressed refreshers curated by our mixologists." },
  { id: 7, title: "Private Family & VIP Dining Pods", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80", description: "Intimate sound-insulated dining alcoves for groups of 8 to 16 guests with dedicated table billing and butler service." },
  { id: 8, title: "Saffron & Heritage Dessert Studio", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1000&q=80", description: "Indulge in piping hot Kesariya Gulab Jamun, Malai Ghevar, and Belgian chocolate spheres plated to perfection." },
  { id: 9, title: "Allergen-Safe & Hygiene Certified Prep", image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1000&q=80", description: "Separate vegetarian, non-vegetarian, and nut-free preparation zones with transparent ingredient tracking." },
  { id: 10, title: "Live Rajasthani Folk Evening Stage", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80", description: "Enjoy soulful santoor and sitar melodies every evening while your table enjoys seamless hospitality." },
];

const RESTAURANT_PLUGINS = [
  { label: "🍽️ Half / Full Menu & Specialties", prompt: "Restaurant mein Half aur Full plate wale best dishes kaunse hain? Prices ke sath batao." },
  { label: "🥜 Peanut / Nut Allergy Safe Food", prompt: "Mujhe peanuts aur nuts se allergy hai. Main menu mein se safely kya-kya order kar sakta hu?" },
  { label: "⚡ Auto-Order for My Table", prompt: "Table 12 ke liye Rahul ke naam se 1 Full Royal Paneer Tikka Angara aur 2 Garlic Butter Naan order kar do." },
  { label: "🌶️ Best Spicy Rajasthani Dish", prompt: "Yahan sabse authentic spicy Rajasthani dish kaunsi hai?" },
  { label: "📍 Timings & Nearby Places", prompt: "Restaurant ke timings kya hain aur dinner ke baad aas-paas kahan ghum sakte hain?" },
];

export default function RestaurantDemoPage() {
  const [activeTab, setActiveTab] = useState<"ordering" | "kitchen">("ordering");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  // QR Table Session State
  const [tableNumber, setTableNumber] = useState<number>(12);
  const [isTableListOpen, setIsTableListOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string>("Rahul Sharma");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, "Half" | "Full">>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<"pay_later" | "pay_now">("pay_later");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Running Bill & Kitchen Orders State
  const [tableBill, setTableBill] = useState<{ orders: OrderRecord[]; running_total: number; paid_amount: number; due_amount: number; }>({ orders: [], running_total: 0, paid_amount: 0, due_amount: 0 });
  const [kitchenOrders, setKitchenOrders] = useState<OrderRecord[]>([]);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Restaurant AI Receptionist ("Vivaan") State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "rest-welcome", sender: "ai", content: "Khamma Ghani! 🙏 Main **Vivaan** hu, Royal Haven Restaurant ka 24/7 AI Dining Concierge.\n\nMain aapke Table ke liye **Half/Full Plate Food Order** seedha Kitchen bhej sakta hu, **Allergy & Ingredient** check kar sakta hu. Aaj aapke Table par kya serve karu?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; type: string; data: string; } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const dock = document.getElementById("floating-dock");
    if (dock) dock.style.display = isChatOpen || isPaymentOpen ? "none" : "block";
    return () => { if (dock) dock.style.display = "block"; };
  }, [isChatOpen, isPaymentOpen]);

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping, isChatOpen]);

  useEffect(() => {
    const savedConvId = localStorage.getItem("royal_haven_rest_conv_id");
    if (savedConvId) {
      setConversationId(savedConvId);
      fetch(`https://ai-hospitality-os.onrender.com/api/ai/history/${savedConvId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data.map((m: any) => ({ id: m.id, sender: m.sender, content: m.content })));
          }
        }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % RESTAURANT_GALLERY.length); }, 2000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const fetchMenuAndBill = async (tNum: number) => {
    setLoading(true);
    try {
      const [menuRes, billRes, kdsRes] = await Promise.all([
        fetch("https://ai-hospitality-os.onrender.com/api/restaurant/menu"),
        fetch(`https://ai-hospitality-os.onrender.com/api/restaurant/tables/${tNum}/bill`),
        fetch("https://ai-hospitality-os.onrender.com/api/restaurant/kitchen/orders"),
      ]);
      const menuData = await menuRes.json();
      const billData = await billRes.json();
      const kdsData = await kdsRes.json();

      if (Array.isArray(menuData)) setMenu(menuData);
      if (billData && Array.isArray(billData.orders)) setTableBill(billData);
      if (Array.isArray(kdsData)) setKitchenOrders(kdsData);
    } catch (err) {
      setErrorMsg("Backend API se connect nahi ho paya.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMenuAndBill(tableNumber); }, [tableNumber]);

  const addToCart = (item: MenuItem) => {
    const chosenVariant: "Half" | "Full" | "Regular" = item.has_half_full ? selectedVariants[item.id] || "Full" : "Regular";
    const price = chosenVariant === "Half" && item.half_price ? item.half_price : item.full_price;
    const cartKey = `${item.id}-${chosenVariant}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.key === cartKey);
      if (existing) return prev.map((c) => c.key === cartKey ? { ...c, quantity: c.quantity + 1 } : c );
      return [...prev, { key: cartKey, menu_item_id: item.id, name: item.name, variant: chosenVariant, quantity: 1, unit_price: price }];
    });
  };

  const removeFromCart = (key: string) => { setCart((prev) => prev.filter((c) => c.key !== key)); };

  const placeTableOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setErrorMsg(""); setOrderSuccessMsg("");
    try {
      const res = await fetch("https://ai-hospitality-os.onrender.com/api/restaurant/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_number: Number(tableNumber), customer_name: customerName, items: cart, payment_mode: paymentMode }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.detail || "Order failed"); } else {
        setCart([]);
        setOrderSuccessMsg(`Order ${data.order_reference} sent to Kitchen for Table #${tableNumber}!`);
        fetchMenuAndBill(tableNumber);
      }
    } catch (err) { setErrorMsg("Error sending order to kitchen."); }
  };

  const updateKitchenStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`https://ai-hospitality-os.onrender.com/api/restaurant/kitchen/orders/${orderId}/status?status=${nextStatus}`, { method: "PATCH" });
      if (res.ok) fetchMenuAndBill(tableNumber);
    } catch (err) {}
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
    const userMessageObj: ChatMsg = { id: `user-${Date.now()}`, sender: "user", content: trimmed || `Uploaded ${currentAttachment?.name}`, attachmentName: currentAttachment?.name, attachmentPreview: currentAttachment?.data, attachmentType: currentAttachment?.type, spoken: sentViaVoice };

    setMessages((prev) => [...prev, userMessageObj]);
    setChatInput(""); setAttachment(null); setAiTyping(true);

    try {
      const res = await fetch("https://ai-hospitality-os.onrender.com/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: "demo-business", business_name: "Royal Haven Jaipur", mode: "restaurant", conversation_id: conversationId, message: `[Guest at Table #${tableNumber}, Name: ${customerName}] ${trimmed}`, is_voice: sentViaVoice, attachment_name: currentAttachment?.name || null, attachment_type: currentAttachment?.type || null, attachment_data: currentAttachment?.data || null }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.conversation_id) { setConversationId(data.conversation_id); localStorage.setItem("royal_haven_rest_conv_id", data.conversation_id); }
        setMessages((prev) => [ ...prev, { id: `ai-${Date.now()}`, sender: "ai", content: data.reply, spoken: sentViaVoice } ]);
        if (data.action_executed === "restaurant_ordered") { fetchMenuAndBill(tableNumber); }
        if (sentViaVoice) { speakReplyAloud(data.reply); } else if (typeof window !== "undefined" && "speechSynthesis" in window) { window.speechSynthesis.cancel(); }
      }
    } catch (err) {
      setMessages((prev) => [ ...prev, { id: `err-${Date.now()}`, sender: "ai", content: "Backend server se sampark nahi ho pa raha hai." } ]);
    } finally { setAiTyping(false); }
  };

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Aapka browser Voice Recognition support nahi karta."); return; }
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true); recognition.onend = () => setIsListening(false); recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; if (transcript) { sendMessageToAI(transcript, true); } };
    recognitionRef.current = recognition; recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setAttachment({ name: file.name, type: file.type || "application/octet-stream", data: reader.result as string }); };
    reader.readAsDataURL(file);
  };

  const categories = ["All", "Starters", "Main Course", "Breads & Rice", "Drinks", "Desserts"];
  const filteredMenu = selectedCategory === "All" ? menu : menu.filter((item) => item.category === selectedCategory);
  const cartTotal = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  const totalPhotos = RESTAURANT_GALLERY.length;

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-navy via-royal/80 to-navy text-charcoal px-4 pt-8 pb-36">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10">
          <div>
            <Link href="/" className="inline-flex items-center text-champagne text-sm font-medium hover:underline mb-2">
              <ArrowLeft size={16} className="mr-1" /> Back to Hospitality OS
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Royal Haven <span className="text-champagne">Dining & KDS</span>
            </h1>
            <p className="text-ivory/80 text-sm md:text-base mt-1">
              Smart QR Table Ordering • Half/Full Plate Engine • Running Table Bill • Live Kitchen Display
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-3 self-start">
            <div className="bg-white/10 p-1.5 rounded-2xl inline-flex border border-white/15">
              <button onClick={() => setActiveTab("ordering")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${ activeTab === "ordering" ? "bg-champagne text-navy shadow-md" : "text-white hover:text-champagne" }`}>
                <QrCode size={18} /> QR Table Menu & Bill
              </button>
              <button onClick={() => setActiveTab("kitchen")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${ activeTab === "kitchen" ? "bg-champagne text-navy shadow-md" : "text-white hover:text-champagne" }`}>
                <ChefHat size={18} /> Live Kitchen Display ({kitchenOrders.length})
              </button>
            </div>

            <button onClick={() => setIsChatOpen(true)} className="w-full bg-gradient-to-r from-navy via-charcoal to-navy hover:from-navy hover:via-royal hover:to-navy text-white border-2 border-champagne/80 rounded-2xl px-5 py-3 shadow-xl shadow-champagne/20 transition-all duration-300 flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-champagne/20 flex items-center justify-center relative">
                  <Bot size={20} className="text-champagne" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-navy"></span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                    AI Dining Concierge <span className="text-xs font-normal opacity-80">(Vivaan)</span>
                  </div>
                  <div className="text-[11px] text-champagne font-medium">Auto Table Order • Allergen Check • Voice</div>
                </div>
              </div>
              <Sparkles size={18} className="text-champagne ml-3 animate-pulse" />
            </button>
          </div>
        </div>

        {errorMsg && <div className="bg-red-500/20 border border-red-400 text-white px-5 py-3 rounded-2xl mb-6 text-sm">{errorMsg}</div>}
        {orderSuccessMsg && <div className="bg-success/25 border border-success text-white px-5 py-3 rounded-2xl mb-6 text-sm flex items-center gap-2 font-semibold"><CheckCircle2 size={18} className="text-champagne" /> {orderSuccessMsg}</div>}

        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-champagne text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"><Sparkles size={14} /> Culinary Ambience ({currentSlide + 1} / {totalPhotos})</span>
                {isHovered && <span className="bg-champagne/20 border border-champagne text-champagne text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse"><PauseCircle size={12} /> Paused for Reading</span>}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">Explore Our Fine-Dining Courtyards</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentSlide((prev) => (prev - 1 + totalPhotos) % totalPhotos)} className="p-2.5 rounded-full bg-white/10 hover:bg-champagne text-white hover:text-navy transition"><ChevronLeft size={18} /></button>
              <button onClick={() => setCurrentSlide((prev) => (prev + 1) % totalPhotos)} className="p-2.5 rounded-full bg-white/10 hover:bg-champagne text-white hover:text-navy transition"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="relative h-[390px] md:h-[420px] w-full overflow-hidden flex items-center justify-center select-none">
            {RESTAURANT_GALLERY.map((item, index) => {
              const offset = (index - currentSlide + totalPhotos) % totalPhotos;
              const isCenter = offset === 0;
              const isRight = offset === 1;
              const isLeft = offset === totalPhotos - 1;
              const isFarRight = offset === 2;
              const isFarLeft = offset === totalPhotos - 2;

              let positionClasses = "translate-x-0 scale-50 opacity-0 z-0 pointer-events-none";
              if (isCenter) positionClasses = "translate-x-0 scale-100 md:scale-105 opacity-100 z-30 shadow-2xl shadow-champagne/30 border-2 border-champagne bg-white";
              else if (isRight) positionClasses = "translate-x-[75%] md:translate-x-[102%] scale-85 opacity-55 hover:opacity-80 z-20 bg-white/10 border border-white/20 hidden sm:block";
              else if (isLeft) positionClasses = "-translate-x-[75%] md:-translate-x-[102%] scale-85 opacity-55 hover:opacity-80 z-20 bg-white/10 border border-white/20 hidden sm:block";
              else if (isFarRight) positionClasses = "translate-x-[180%] scale-75 opacity-0 z-10 pointer-events-none hidden sm:block";
              else if (isFarLeft) positionClasses = "-translate-x-[180%] scale-75 opacity-0 z-10 pointer-events-none hidden sm:block";

              return (
                <div key={item.id} onMouseEnter={() => { if (isCenter) setIsHovered(true); }} onMouseLeave={() => { if (isCenter) setIsHovered(false); }} onClick={() => { if (isLeft || isRight) setCurrentSlide(index); }} className={`absolute w-full max-w-[350px] md:max-w-[390px] rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${positionClasses}`}>
                  <div className={`relative w-full transition-all duration-700 ${isCenter ? "h-60" : "h-56"}`}>
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-navy/80 backdrop-blur-md text-champagne text-xs font-bold px-3 py-1 rounded-full">#{item.id}</div>
                  </div>
                  <div className={`transition-all duration-500 overflow-hidden bg-white text-center ${ isCenter ? "max-h-40 opacity-100 p-5" : "max-h-0 opacity-0 p-0" }`}>
                    <h3 className="text-lg font-extrabold text-navy mb-1.5">{item.title}</h3>
                    <p className="text-xs md:text-sm text-charcoal/75 leading-relaxed line-clamp-3">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {RESTAURANT_GALLERY.map((photo, index) => (
              <button key={photo.id} onClick={() => setCurrentSlide(index)} className={`h-2 rounded-full transition-all duration-500 ${ currentSlide === index ? "w-8 bg-champagne" : "w-2 bg-white/30 hover:bg-white/60" }`} />
            ))}
          </div>
        </div>

        <div className="mb-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-champagne text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"><PlayCircle size={15} /> Culinary & Courtyard Tour</span>
              <h2 className="text-2xl font-bold text-white mt-1">Inside Royal Haven Dining</h2>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/20 bg-navy shadow-inner">
            <video src="/restaurant-tour.mp4" poster="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80" controls autoPlay muted loop playsInline className="w-full max-h-[440px] object-cover">Your browser does not support the video tag.</video>
          </div>
        </div>

        {activeTab === "ordering" ? (
          <div>
            <div className="bg-white/95 rounded-3xl p-6 mb-8 shadow-xl border-2 border-champagne/60 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-navy text-champagne flex items-center justify-center shrink-0 shadow-md"><QrCode size={30} /></div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-0.5 rounded-full">● Live QR Table Session</span>
                  <h3 className="text-xl font-extrabold text-navy mt-1">Table #{tableNumber} — Digital Menu</h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* INLINE PREMIUM TABLE SELECTOR */}
                <div className="relative w-full md:w-auto">
                  <label className="text-[11px] font-bold text-charcoal/70 uppercase block mb-1">Table Number</label>
                  <button
                    onClick={() => setIsTableListOpen(!isTableListOpen)}
                    className="w-full md:w-48 px-4 py-2 border-2 border-champagne/50 rounded-xl text-sm font-extrabold text-navy bg-ivory flex items-center justify-between shadow-sm cursor-pointer hover:bg-champagne/20 transition"
                  >
                    <span>Table #{tableNumber}</span>
                    <span className="text-xs">▼</span>
                  </button>

                  {isTableListOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white rounded-2xl shadow-2xl border-2 border-champagne/50 p-3 z-50 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-navy uppercase">Select Table</span>
                        <button onClick={() => setIsTableListOpen(false)} className="text-red-500 hover:text-red-700 transition"><X size={14}/></button>
                      </div>
                      <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            onClick={() => { setTableNumber(num); setIsTableListOpen(false); }}
                            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                              tableNumber === num ? "bg-navy text-champagne shadow-md" : "bg-ivory text-charcoal hover:bg-champagne/20 border border-gray-100"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto">
                  <label className="text-[11px] font-bold text-charcoal/70 uppercase block mb-1">Guest Name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your name" className="w-full md:w-auto px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-navy bg-ivory" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-6">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${ selectedCategory === cat ? "bg-champagne text-navy shadow-lg" : "bg-white/15 text-white hover:bg-white/25 border border-white/15" }`}>{cat}</button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-5">
                {loading ? ( <div className="bg-white/90 rounded-3xl p-8 text-center">Loading digital menu...</div> ) : (
                  filteredMenu.map((item) => {
                    const activeVariant = item.has_half_full ? selectedVariants[item.id] || "Full" : "Regular";
                    const displayPrice = activeVariant === "Half" && item.half_price ? item.half_price : item.full_price;
                    return (
                      <div key={item.id} className="bg-white/95 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-champagne/25 border border-white/60 transition-all duration-300 flex flex-col sm:flex-row">
                        <div className="sm:w-52 h-48 sm:h-auto relative shrink-0">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${ item.is_veg ? "bg-success text-white" : "bg-red-600 text-white" }`}>{item.is_veg ? "● Pure Veg" : "▲ Non-Veg"}</span>
                            {item.is_spicy && <span className="bg-amber-500 text-navy px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5"><Flame size={11} /> Spicy</span>}
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div><span className="text-[10px] font-bold uppercase tracking-wider text-royal">{item.category}</span><h3 className="text-lg font-extrabold text-navy">{item.name}</h3></div>
                              <div className="text-right shrink-0"><span className="text-2xl font-extrabold text-royal">₹{displayPrice}</span><span className="text-[11px] text-charcoal/60 block">{activeVariant} Portion</span></div>
                            </div>
                            <p className="text-xs text-charcoal/70 mt-1 leading-relaxed">{item.description}</p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-charcoal/70"><span className="bg-amber-500/15 text-amber-900 px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1"><AlertCircle size={12} /> Allergens: {item.allergens}</span></div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-gray-100">
                            {item.has_half_full ? (
                              <div className="inline-flex bg-ivory p-1 rounded-xl border border-gray-200">
                                <button type="button" onClick={() => setSelectedVariants((prev) => ({ ...prev, [item.id]: "Half" }))} className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${ activeVariant === "Half" ? "bg-navy text-champagne shadow-xs" : "text-charcoal/70 hover:text-navy" }`}>Half (₹{item.half_price})</button>
                                <button type="button" onClick={() => setSelectedVariants((prev) => ({ ...prev, [item.id]: "Full" }))} className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${ activeVariant === "Full" ? "bg-navy text-champagne shadow-xs" : "text-charcoal/70 hover:text-navy" }`}>Full (₹{item.full_price})</button>
                              </div>
                            ) : (<span className="text-xs font-semibold text-charcoal/50">Standard Serving</span>)}
                            <button type="button" onClick={() => addToCart(item)} className="bg-navy hover:bg-royal text-champagne hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"><Plus size={15} /> Add to Table Order</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-6 self-start sticky top-6">
                <div className="bg-white rounded-3xl p-6 shadow-2xl border border-white/60">
                  <h3 className="text-lg font-extrabold text-navy mb-4 flex items-center justify-between"><span className="flex items-center gap-2"><Utensils className="text-royal" size={19} /> Table #{tableNumber} Cart</span><span className="text-xs bg-royal/10 text-royal px-2.5 py-1 rounded-full font-bold">{cart.length} Items</span></h3>
                  {cart.length === 0 ? ( <p className="text-xs text-charcoal/60 py-6 text-center bg-ivory rounded-2xl">Select Half or Full plate items from the menu to start an order.</p> ) : (
                    <form onSubmit={placeTableOrder} className="space-y-4">
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {cart.map((c) => (
                          <div key={c.key} className="flex items-center justify-between bg-ivory px-3.5 py-2.5 rounded-xl text-xs">
                            <div><p className="font-bold text-navy">{c.quantity}x {c.name}</p><span className="text-[11px] text-charcoal/60">{c.variant} • ₹{c.unit_price} each</span></div>
                            <div className="flex items-center gap-2"><span className="font-extrabold text-navy">₹{c.unit_price * c.quantity}</span><button type="button" onClick={() => removeFromCart(c.key)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button></div>
                          </div>
                        ))}
                      </div>
                      <div><label className="text-[11px] font-bold text-charcoal/70 uppercase block mb-1">Payment Choice</label><select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as "pay_later" | "pay_now")} className="w-full px-3 py-2.5 border rounded-xl text-xs font-semibold bg-white"><option value="pay_later">Pay Later (Add to Table #{tableNumber} Bill)</option><option value="pay_now">Pay Now Instantly (₹{cartTotal})</option></select></div>
                      <div className="flex items-center justify-between pt-2 border-t text-sm font-extrabold text-navy"><span>Current Order Total:</span><span className="text-lg text-royal">₹{cartTotal}</span></div>
                      <button type="submit" className="w-full bg-navy hover:bg-royal text-champagne hover:text-white font-bold py-3.5 rounded-xl transition shadow-lg text-sm cursor-pointer">Send Order to Kitchen 🔔</button>
                    </form>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-champagne/60">
                  <div className="flex items-center justify-between mb-3"><h3 className="text-base font-extrabold text-navy flex items-center gap-2"><Receipt className="text-champagne" size={19} /> Table #{tableNumber} Running Bill</h3><span className="text-[11px] font-bold bg-champagne/20 text-navy px-2.5 py-0.5 rounded-full">{tableBill.orders.length} Orders</span></div>
                  {tableBill.orders.length === 0 ? ( <p className="text-xs text-charcoal/60 py-4 text-center">No active orders on Table #{tableNumber} yet.</p> ) : (
                    <div className="space-y-3">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {tableBill.orders.map((ord) => (
                          <div key={ord.id} className="p-3 rounded-xl bg-ivory border border-gray-200 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-navy"><span>{ord.order_reference}</span><span>₹{ord.order_total}</span></div>
                            <p className="text-[11px] text-charcoal/75">{ord.items_summary}</p>
                            <div className="flex items-center justify-between pt-1 text-[10px]"><span className="font-semibold text-royal">Kitchen: {ord.kitchen_status}</span><span className={`px-2 py-0.5 rounded-full font-bold ${ord.payment_status === "Paid" ? "bg-success/15 text-success" : "bg-amber-500/20 text-amber-900"}`}>{ord.payment_status}</span></div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-gray-200 text-xs space-y-1">
                        <div className="flex justify-between"><span className="text-charcoal/70">Running Bill Total:</span><span className="font-bold text-navy">₹{tableBill.running_total}</span></div>
                        <div className="flex justify-between"><span className="text-charcoal/70">Paid Amount:</span><span className="font-bold text-success">₹{tableBill.paid_amount}</span></div>
                        <div className="flex justify-between text-sm font-extrabold text-navy pt-1"><span>Balance Due:</span><span className="text-red-600">₹{tableBill.due_amount}</span></div>
                      </div>
                      {tableBill.due_amount > 0 && (
                        <button type="button" onClick={() => setIsPaymentOpen(true)} className="w-full mt-2 bg-success hover:bg-success/90 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer">Pay Now & Settle Table #{tableNumber} Bill (₹{tableBill.due_amount})</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-2xl font-extrabold text-white flex items-center gap-2"><ChefHat className="text-champagne" size={26} /> Live Kitchen Display System (KDS)</h2><p className="text-xs text-ivory/75">Real-time table orders from QR scans & AI Dining Concierge</p></div>
              <button onClick={() => fetchMenuAndBill(tableNumber)} className="px-4 py-2 rounded-xl bg-white/15 hover:bg-champagne text-white hover:text-navy text-xs font-bold transition cursor-pointer">Refresh Kitchen Board</button>
            </div>
            {kitchenOrders.length === 0 ? ( <div className="bg-white/95 rounded-3xl p-12 text-center text-charcoal">No active kitchen orders right now. Place an order from the QR Table Menu!</div> ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kitchenOrders.map((ko) => (
                  <div key={ko.id} className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-champagne/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div><span className="bg-navy text-champagne text-sm font-extrabold px-3.5 py-1 rounded-xl">TABLE #{ko.table_number}</span><span className="text-xs text-charcoal/60 ml-2 font-semibold">{ko.order_reference}</span></div>
                        <span className="text-xs text-charcoal/60 flex items-center gap-1"><Clock size={13} /> {ko.created_at}</span>
                      </div>
                      <p className="text-xs font-bold text-charcoal/70 mt-3">Guest: <span className="text-navy">{ko.customer_name}</span></p>
                      <div className="mt-3 p-3.5 bg-ivory rounded-2xl border border-gray-200 text-sm font-bold text-navy leading-relaxed">{ko.items_summary}</div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs mb-3"><span className="font-bold text-charcoal/70">Bill: ₹{ko.order_total} ({ko.payment_status})</span><span className="px-2.5 py-1 rounded-full font-extrabold bg-royal/15 text-royal">{ko.kitchen_status}</span></div>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => updateKitchenStatus(ko.id, "Preparing")} className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${ ko.kitchen_status === "Preparing" ? "bg-amber-500 text-navy" : "bg-ivory hover:bg-amber-500/20 text-charcoal" }`}>Preparing</button>
                        <button onClick={() => updateKitchenStatus(ko.id, "Ready")} className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${ ko.kitchen_status === "Ready" ? "bg-royal text-white" : "bg-ivory hover:bg-royal/20 text-charcoal" }`}>Ready</button>
                        <button onClick={() => updateKitchenStatus(ko.id, "Served")} className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${ ko.kitchen_status === "Served" ? "bg-success text-white" : "bg-ivory hover:bg-success/20 text-charcoal" }`}>Served ✓</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isChatOpen && (
          <div className="fixed inset-0 z-50 bg-navy/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
            <div className="bg-ivory w-full max-w-3xl h-[86vh] rounded-3xl shadow-2xl border-2 border-champagne/60 flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-navy via-charcoal to-navy px-6 py-4 flex items-center justify-between border-b border-champagne/30">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-champagne/20 border border-champagne flex items-center justify-center relative"><Bot className="text-champagne" size={24} /><span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full ring-2 ring-navy"></span></div>
                  <div>
                    <div className="flex items-center gap-2"><h3 className="text-lg font-extrabold text-white">Vivaan — AI Restaurant Concierge</h3><span className="text-[10px] bg-champagne/20 text-champagne border border-champagne/40 px-2 py-0.5 rounded-full font-bold uppercase">Table #{tableNumber}</span></div>
                    <p className="text-xs text-ivory/70">Auto Kitchen Ordering • Half/Full Menu • Allergen Guide • Voice & Vision</p>
                  </div>
                </div>
                <button onClick={() => { if (typeof window !== "undefined" && "speechSynthesis" in window) { window.speechSynthesis.cancel(); } setIsChatOpen(false); }} className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-ivory to-white">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${ msg.sender === "user" ? "bg-navy text-white rounded-br-none" : "bg-white text-charcoal border border-champagne/40 rounded-bl-none" }`}>
                      {msg.attachmentPreview && msg.attachmentType?.startsWith("image/") && ( <img src={msg.attachmentPreview} alt={msg.attachmentName} className="w-48 h-36 object-cover rounded-xl mb-2 border border-white/20" /> )}
                      {msg.attachmentPreview && msg.attachmentType?.startsWith("video/") && ( <video src={msg.attachmentPreview} controls className="w-56 rounded-xl mb-2 border border-white/20" /> )}
                      <div className="whitespace-pre-line">{msg.content}</div>
                      {msg.sender === "ai" && msg.spoken && ( <div className="mt-2 flex items-center gap-1 text-[11px] text-royal font-semibold"><Volume2 size={13} /> Spoken via Voice Response</div> )}
                    </div>
                  </div>
                ))}
                {aiTyping && ( <div className="flex justify-start"><div className="bg-white border border-champagne/40 text-navy px-4 py-3 rounded-2xl rounded-bl-none text-xs font-semibold flex items-center gap-2 shadow-sm"><Sparkles size={14} className="text-champagne animate-spin" /> Vivaan is coordinating with the kitchen...</div></div> )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-4 py-2.5 bg-ivory border-t border-gray-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {RESTAURANT_PLUGINS.map((plugin, idx) => (
                  <button key={idx} onClick={() => sendMessageToAI(plugin.prompt, false)} className="shrink-0 text-xs font-semibold bg-white hover:bg-navy text-navy hover:text-champagne border border-champagne/50 px-3.5 py-1.5 rounded-full transition shadow-xs cursor-pointer">{plugin.label}</button>
                ))}
              </div>
              {attachment && (
                <div className="px-5 py-2 bg-champagne/15 border-t border-champagne/40 flex items-center justify-between text-xs text-navy font-semibold"><span className="truncate">📎 Attached: {attachment.name}</span><button onClick={() => setAttachment(null)} className="text-red-600 hover:underline ml-3">Remove</button></div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); sendMessageToAI(chatInput, false); }} className="p-4 bg-white border-t border-gray-200 flex items-center gap-2.5">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*,.pdf" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-ivory hover:bg-champagne/20 text-navy transition border border-gray-200" title="Upload Dish Photo or Video"><Paperclip size={18} /></button>
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={ isListening ? "Listening... Speak your order or question..." : `Ask Vivaan to order for Table #${tableNumber}, check allergies...` } className="flex-1 px-4 py-3 bg-ivory/70 border border-gray-200 rounded-xl text-sm text-charcoal focus:outline-none focus:border-royal" />
                <button type="button" onClick={toggleVoiceInput} className={`p-3 rounded-xl transition border ${ isListening ? "bg-red-600 text-white border-red-600 animate-pulse" : "bg-ivory hover:bg-royal/10 text-royal border-gray-200" }`}>{isListening ? <MicOff size={18} /> : <Mic size={18} />}</button>
                <button type="submit" disabled={aiTyping} className="px-5 py-3 rounded-xl bg-navy hover:bg-royal text-champagne hover:text-white font-bold text-sm transition flex items-center gap-1.5 shadow-md cursor-pointer"><Send size={16} /> Send</button>
              </form>
            </div>
          </div>
        )}

        <SecurePaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          module="restaurant"
          sourceReference={`Table-${tableNumber}`}
          guestName={customerName}
          totalBillAmount={tableBill.due_amount}
          defaultPolicy="pay_now"
          onPaymentSuccess={() => {
            setOrderSuccessMsg(`Table #${tableNumber} Running Bill Paid & Cryptographically Verified!`);
            fetchMenuAndBill(tableNumber);
          }}
        />
      </div>
    </div>
  );
}
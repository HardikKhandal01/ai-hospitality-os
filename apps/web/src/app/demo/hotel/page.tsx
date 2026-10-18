"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  PartyPopper,
  BedDouble,
  ArrowLeft,
  Sparkles,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  PauseCircle,
  Bot,
  Send,
  Mic,
  MicOff,
  Paperclip,
  X,
  Volume2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import SecurePaymentModal from "@/components/payments/SecurePaymentModal";

interface RoomType {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  total_inventory: number;
  available_rooms: number;
  amenities: string;
  cancellation_policy: string;
}

interface ChatMsg {
  id: string;
  sender: "user" | "ai";
  content: string;
  attachmentName?: string;
  attachmentPreview?: string;
  attachmentType?: string;
  spoken?: boolean;
}

const HOTEL_GALLERY = [
  {
    id: 1,
    title: "Grand Heritage Exterior & Facade",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80",
    description:
      "Royal Rajasthani architecture welcoming guests with grand arches, sandstone courtyards, and warm evening illumination.",
  },
  {
    id: 2,
    title: "Imperial Chandelier Lobby",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80",
    description:
      "Step into our opulent marble-floored lobby featuring handcrafted crystal chandeliers and 24/7 AI & concierge hospitality.",
  },
  {
    id: 3,
    title: "Temperature-Controlled Infinity Pool",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80",
    description:
      "Relax by our azure poolside cabanas with private deck loungers, poolside mocktail service, and serene sunset views.",
  },
  {
    id: 4,
    title: "Royal Corridor & Suite Walkways",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80",
    description:
      "Quiet, plush-carpeted heritage hallways outside our guest rooms designed for privacy, comfort, and timeless elegance.",
  },
  {
    id: 5,
    title: "Exclusive Night Club & Lounge",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=80",
    description:
      "Unwind in our soundproof luxury club lounge featuring curated music, artisan beverages, and VIP private seating.",
  },
  {
    id: 6,
    title: "Indoor Games & Recreation Arena",
    image: "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1000&q=80",
    description:
      "Equipped with billiards, table tennis, arcade zones, and family board games to keep every age group entertained.",
  },
  {
    id: 7,
    title: "Mughal Landscaped Lush Gardens",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1000&q=80",
    description:
      "Stroll through manicured lawns, marble fountains, and fragrant floral pathways ideal for morning walks and open-air tea.",
  },
  {
    id: 8,
    title: "Maharaja Fine-Dining Courtyard",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    description:
      "Savor authentic royal delicacies and global cuisines prepared live by master chefs in an unforgettable ambiance.",
  },
  {
    id: 9,
    title: "Wellness Spa & Jacuzzi Sanctuary",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
    description:
      "Rejuvenate your senses with Ayurvedic therapies, aromatic steam baths, and private hydrotherapy sessions.",
  },
  {
    id: 10,
    title: "Grand Royal Wedding Banquet Hall",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80",
    description:
      "Pillarless luxury banquet space accommodating up to 500 guests with custom stage decor and 50-room wedding blocks.",
  },
];

// 5 Curated Instant Plugins for Quick Actions
const QUICK_PLUGINS = [
  {
    label: "🛏️ Auto-Book a Room",
    prompt: "Mujhe aaj ke liye 1 Double Comfort Room book karna hai. Kya available hai?",
  },
  {
    label: "🍽️ Food Menu & Order",
    prompt: "Hotel ke restaurant mein khane mein sabse special kya hai? Menu aur prices dikhao.",
  },
  {
    label: "🧹 Room Service / Water",
    prompt: "Room 204 mein 2 mineral water bottles aur fresh towels bhej dijiye.",
  },
  {
    label: "📍 Nearby Tourist Places",
    prompt: "Royal Haven Jaipur ke aas-paas ghumne ke liye best tourist places kaunsi hain?",
  },
  {
    label: "📞 Talk to Human Manager",
    prompt: "Mujhe hotel manager se direct baat karni hai ya morning call schedule karwani hai.",
  },
];

const getRoomPhoto = (roomName: string) => {
  const lower = roomName.toLowerCase();
  if (lower.includes("single")) {
    return "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("double")) {
    return "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("deluxe")) {
    return "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("family")) {
    return "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("presidential") || lower.includes("wedding")) {
    return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80";
};

export default function HotelDemoPage() {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"rooms" | "banquet">("rooms");
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Carousel States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Secure Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // AI Receptionist States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome-1",
      sender: "ai",
      content:
        "Namaste! 🙏 Main **Aaradhya** hu, Royal Haven Jaipur ki 24/7 AI Concierge & Receptionist.\n\nMain aapke liye **Room Book** kar sakti hu, **Room Service (Food, Water, Cleaning)** bhej sakti hu, **Nearby Jaipur Places** bata sakti hu, ya aapki photo/video dekh kar madad kar sakti hu. Bataiye aaj main aapki kya seva karu?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat upward as new messages arrive
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiTyping, isChatOpen]);

  // Chatbox ya Payment Modal open hone par Floating Dock ko hide karega
  useEffect(() => {
    const dock = document.getElementById("floating-dock");
    if (dock) {
      dock.style.display = isChatOpen || isPaymentOpen ? "none" : "block";
    }
    return () => {
      if (dock) dock.style.display = "block";
    };
  }, [isChatOpen, isPaymentOpen]);

  // Restore Persistent Chat History from Session/Database
  useEffect(() => {
    const savedConvId = localStorage.getItem("royal_haven_hotel_conv_id");
    if (savedConvId) {
      setConversationId(savedConvId);
      fetch(`https://ai-hospitality-os.onrender.com/api/ai/history/${savedConvId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const loaded: ChatMsg[] = data.map((m: any) => ({
              id: m.id,
              sender: m.sender,
              content: m.content,
            }));
            setMessages(loaded);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HOTEL_GALLERY.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [isHovered]);

  // Room Booking Form State
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [roomsCount, setRoomsCount] = useState(1);
  const [guestsCount, setGuestsCount] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentOption, setPaymentOption] = useState("advance_20");
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Wedding / Banquet Form State
  const [eventType, setEventType] = useState("Royal Wedding & Banquet");
  const [roomsRequired, setRoomsRequired] = useState(35);
  const [expectedGuests, setExpectedGuests] = useState(250);
  const [banquetHall, setBanquetHall] = useState(true);
  const [catering, setCatering] = useState(true);
  const [groupResult, setGroupResult] = useState<any>(null);

  const fetchRooms = async (inDate: string, outDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://ai-hospitality-os.onrender.com/api/hotel/rooms?check_in=${inDate}&check_out=${outDate}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setRooms(data);
        if (data.length > 0 && !selectedRoomId) {
          setSelectedRoomId(data[0].id);
        }
      }
    } catch (err) {
      setErrorMsg(
        "Backend API se connect nahi ho paya. Make sure FastAPI port 8000 par chal raha hai."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(checkIn, checkOut);
  }, [checkIn, checkOut]);

  // Text-to-Speech Function (ONLY called when user used Voice Input)
  const speakReplyAloud = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~•]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "hi-IN";
    utterance.rate = 1.02;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Send Message to Aaradhya AI (Handles both Text & Voice modes)
  const sendMessageToAI = async (rawText: string, sentViaVoice: boolean = false) => {
    const trimmed = rawText.trim();
    if (!trimmed && !attachment) return;

    const currentAttachment = attachment;
    const userMessageObj: ChatMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: trimmed || `Uploaded ${currentAttachment?.name}`,
      attachmentName: currentAttachment?.name,
      attachmentPreview: currentAttachment?.data,
      attachmentType: currentAttachment?.type,
      spoken: sentViaVoice,
    };

    setMessages((prev) => [...prev, userMessageObj]);
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
          mode: "hotel",
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
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
          localStorage.setItem("royal_haven_hotel_conv_id", data.conversation_id);
        }

        const aiMessageObj: ChatMsg = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: data.reply,
          spoken: sentViaVoice,
        };
        setMessages((prev) => [...prev, aiMessageObj]);

        if (data.action_executed === "room_booked") {
          fetchRooms(checkIn, checkOut);
        }

        if (sentViaVoice) {
          speakReplyAloud(data.reply);
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "ai",
            content: "Maaf kijiyega, abhi response lene mein thoda issue aaya. Kripya dubara try karein.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          content: "Backend server se sampark nahi ho pa raha hai. Ensure karein ki FastAPI chal raha ho.",
        },
      ]);
    } finally {
      setAiTyping(false);
    }
  };

  // Voice Input (Speech Recognition)
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Aapka browser Voice Recognition support nahi karta. Chrome ya Edge use karein.");
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
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        sendMessageToAI(transcript, true);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // File / Photo / Video Upload Handler
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

  const handleRoomBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setBookingResult(null);
    try {
      const res = await fetch("https://ai-hospitality-os.onrender.com/api/hotel/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_type_id: selectedRoomId,
          guest_name: guestName,
          guest_phone: guestPhone,
          check_in_date: checkIn,
          check_out_date: checkOut,
          rooms_count: Number(roomsCount),
          guests_count: Number(guestsCount),
          purpose: "Leisure / Direct Web",
          payment_option: paymentOption,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || "Booking failed");
      } else {
        setBookingResult(data);
        fetchRooms(checkIn, checkOut);
      }
    } catch (err) {
      setErrorMsg("Server error occurred while booking.");
    }
  };

  const handleGroupBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setGroupResult(null);
    try {
      const res = await fetch("https://ai-hospitality-os.onrender.com/api/hotel/group-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          guest_phone: guestPhone,
          event_type: eventType,
          check_in_date: checkIn,
          check_out_date: checkOut,
          rooms_required: Number(roomsRequired),
          expected_guests: Number(expectedGuests),
          banquet_hall_required: banquetHall,
          catering_required: catering,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || "Group request failed");
      } else {
        setGroupResult(data);
      }
    } catch (err) {
      setErrorMsg("Server error occurred while submitting group booking.");
    }
  };

  const totalPhotos = HOTEL_GALLERY.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-royal/80 to-navy text-charcoal px-4 pt-8 pb-36">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-champagne text-sm font-medium hover:underline mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Hospitality OS
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Royal Haven <span className="text-champagne">Jaipur</span>
            </h1>
            <p className="text-ivory/80 text-sm md:text-base mt-1">
              Real-Time Inventory • Concurrency Protected • Wedding & Banquet Ready (Up to 50 Rooms)
            </p>
          </div>

          {/* Right Column: Mode Switcher + Rectangular AI Receptionist Box Directly Below It */}
          <div className="flex flex-col items-stretch sm:items-end gap-3 self-start">
            <div className="bg-white/10 p-1.5 rounded-2xl inline-flex border border-white/15">
              <button
                onClick={() => setActiveTab("rooms")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === "rooms"
                    ? "bg-champagne text-navy shadow-md"
                    : "text-white hover:text-champagne"
                }`}
              >
                <BedDouble size={18} /> Room Booking
              </button>
              <button
                onClick={() => setActiveTab("banquet")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === "banquet"
                    ? "bg-champagne text-navy shadow-md"
                    : "text-white hover:text-champagne"
                }`}
              >
                <PartyPopper size={18} /> Wedding / Banquet (50 Rooms)
              </button>
            </div>

            {/* POINT 1: Rectangular AI Receptionist Box Directly Below Switcher */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-full bg-gradient-to-r from-navy via-royal to-navy hover:from-navy/40 hover:to-navy/40 text-white hover:text-ivory/80 border-2 border-champagne/80 rounded-2xl px-5 py-3 shadow-xl shadow-champagne/20 transition-all duration-300 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-champagne/20 group-hover:bg-navy/15 flex items-center justify-center relative">
                  <Bot size={20} className="text-champagne group-hover:text-navy" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-navy"></span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                    AI Receptionist <span className="text-xs font-normal opacity-80">(Aaradhya)</span>
                  </div>
                  <div className="text-[11px] text-champagne group-hover:text-navy/80 font-medium">
                    24/7 Instant Booking • Room Service • Voice & Vision
                  </div>
                </div>
              </div>
              <Sparkles size={18} className="text-champagne group-hover:text-navy ml-3 animate-pulse" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 border border-red-400 text-white px-5 py-3 rounded-2xl mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        {/* =====================================================================
            SECTION 1: SMOOTH SLIDING 10-PHOTO CAROUSEL (PAUSE ON CENTER HOVER)
           ===================================================================== */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-champagne text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} /> Visual Experience ({currentSlide + 1} / {totalPhotos})
                </span>
                {isHovered && (
                  <span className="bg-champagne/20 border border-champagne text-champagne text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <PauseCircle size={12} /> Paused for Reading
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                Explore Our Property & Luxury Amenities
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentSlide((prev) => (prev - 1 + totalPhotos) % totalPhotos)
                }
                className="p-2.5 rounded-full bg-white/10 hover:bg-champagne text-white hover:text-navy transition border border-white/20"
                title="Previous Photo"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % totalPhotos)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-champagne text-white hover:text-navy transition border border-white/20"
                title="Next Photo"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="relative h-[390px] md:h-[420px] w-full overflow-hidden flex items-center justify-center select-none">
            {HOTEL_GALLERY.map((item, index) => {
              const offset = (index - currentSlide + totalPhotos) % totalPhotos;

              const isCenter = offset === 0;
              const isRight = offset === 1;
              const isLeft = offset === totalPhotos - 1;
              const isFarRight = offset === 2;
              const isFarLeft = offset === totalPhotos - 2;

              let positionClasses =
                "translate-x-0 scale-50 opacity-0 z-0 pointer-events-none";

              if (isCenter) {
                positionClasses =
                  "translate-x-0 scale-100 md:scale-105 opacity-100 z-30 shadow-2xl shadow-champagne/30 border-2 border-champagne bg-white";
              } else if (isRight) {
                positionClasses =
                  "translate-x-[75%] md:translate-x-[102%] scale-85 opacity-55 hover:opacity-80 z-20 bg-white/10 border border-white/20 hidden sm:block";
              } else if (isLeft) {
                positionClasses =
                  "-translate-x-[75%] md:-translate-x-[102%] scale-85 opacity-55 hover:opacity-80 z-20 bg-white/10 border border-white/20 hidden sm:block";
              } else if (isFarRight) {
                positionClasses =
                  "translate-x-[180%] scale-75 opacity-0 z-10 pointer-events-none hidden sm:block";
              } else if (isFarLeft) {
                positionClasses =
                  "-translate-x-[180%] scale-75 opacity-0 z-10 pointer-events-none hidden sm:block";
              }

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => {
                    if (isCenter) setIsHovered(true);
                  }}
                  onMouseLeave={() => {
                    if (isCenter) setIsHovered(false);
                  }}
                  onClick={() => {
                    if (isLeft || isRight) setCurrentSlide(index);
                  }}
                  className={`absolute w-full max-w-[350px] md:max-w-[390px] rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${positionClasses}`}
                >
                  <div className={`relative w-full transition-all duration-700 ${isCenter ? "h-60" : "h-56"}`}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-navy/80 backdrop-blur-md text-champagne text-xs font-bold px-3 py-1 rounded-full">
                      #{item.id}
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-500 overflow-hidden bg-white text-center ${
                      isCenter
                        ? "max-h-40 opacity-100 p-5"
                        : "max-h-0 opacity-0 p-0"
                    }`}
                  >
                    <h3 className="text-lg font-extrabold text-navy mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-charcoal/75 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-2 mt-3">
            {HOTEL_GALLERY.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  currentSlide === index
                    ? "w-8 bg-champagne"
                    : "w-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* =====================================================================
            SECTION 2: HOTEL VIRTUAL WALKTHROUGH VIDEO
           ===================================================================== */}
        <div className="mb-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-champagne text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <PlayCircle size={15} /> Complete Property Tour
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Inside Royal Haven: Exterior, Pool, Club, Garden & Suites
              </h2>
            </div>
            <span className="text-xs text-ivory/70 bg-navy/60 px-3.5 py-1.5 rounded-full border border-white/10 self-start md:self-auto">
              HD Virtual Walkthrough
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/20 bg-navy shadow-inner">
            <video
              src="/hotel-tour.mp4"
              poster="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80"
              controls
              autoPlay
              muted
              loop
              playsInline
              className="w-full max-h-[460px] object-cover"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* =====================================================================
            SECTION 3: ROOMS LIST (WITH PHOTOS) & BOOKING ENGINE
           ===================================================================== */}
        {activeTab === "rooms" ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="text-champagne" size={22} /> Live Room Inventory & Availability
              </h2>
              {loading ? (
                <div className="bg-white/90 rounded-3xl p-8 text-center text-charcoal">
                  Loading live rooms...
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`cursor-pointer bg-white/95 rounded-3xl overflow-hidden transition-all duration-300 border-2 flex flex-col sm:flex-row ${
                      selectedRoomId === room.id
                        ? "border-champagne shadow-2xl shadow-champagne/30 -translate-y-0.5"
                        : "border-transparent hover:border-champagne/50 shadow-md"
                    }`}
                  >
                    <div className="sm:w-56 h-48 sm:h-auto relative shrink-0">
                      <img
                        src={getRoomPhoto(room.name)}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 bg-navy/85 backdrop-blur-sm text-champagne text-[11px] font-bold px-2.5 py-1 rounded-full">
                        Max {room.capacity} Guests
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-navy">{room.name}</h3>
                          <p className="text-xs text-charcoal/65 mt-1 leading-relaxed">
                            {room.description}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-2xl font-extrabold text-royal">
                            ₹{room.price_per_night}
                          </span>
                          <span className="text-xs text-charcoal/60 block">per night</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                        <span className="text-charcoal/80 font-medium">
                          ✨ {room.amenities}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full font-bold ${
                            room.available_rooms > 3
                              ? "bg-success/15 text-success"
                              : "bg-amber-500/20 text-amber-800"
                          }`}
                        >
                          {room.available_rooms} / {room.total_inventory} Rooms Left
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-3xl p-7 shadow-2xl shadow-royal/20 border border-white/60 self-start sticky top-6">
              <h3 className="text-xl font-bold text-navy mb-5 flex items-center gap-2">
                <Calendar className="text-royal" size={20} /> Instant Reservation
              </h3>

              <form onSubmit={handleRoomBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-charcoal/70 uppercase">
                      Check-In
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      min={today}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal/70 uppercase">
                      Check-Out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-charcoal/70 uppercase">
                      Rooms
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={roomsCount}
                      onChange={(e) => setRoomsCount(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal/70 uppercase">
                      Total Guests
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Guest Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hardik Sharma"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Payment Preference
                  </label>
                  <select
                    value={paymentOption}
                    onChange={(e) => setPaymentOption(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm bg-white"
                  >
                    <option value="advance_20">20% Advance Now, Rest at Checkout</option>
                    <option value="advance_50">50% Advance Now, Rest at Checkout</option>
                    <option value="full_payment">100% Full Payment Now</option>
                    <option value="pay_at_hotel">Pay at Hotel Desk</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-navy hover:bg-royal text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer"
                >
                  Confirm Room Booking
                </button>
              </form>

              {bookingResult && (
                <div className="mt-5 p-4 bg-success/10 border border-success/30 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-success font-bold text-sm">
                      <CheckCircle2 size={18} /> Booking Confirmed!
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-navy text-champagne font-bold text-[10px] uppercase">
                      {bookingResult.payment_status}
                    </span>
                  </div>
                  <p>
                    <strong>Booking ID:</strong> {bookingResult.booking_reference}
                  </p>
                  <p>
                    <strong>Guest:</strong> {bookingResult.guest_name}
                  </p>
                  <p>
                    <strong>Total Bill:</strong> ₹{bookingResult.total_amount}
                  </p>

                  {bookingResult.payment_status === "pending" && (
                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(true)}
                      className="mt-2 w-full bg-royal hover:bg-navy text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Lock size={14} /> Pay Advance / Full Online (₹{bookingResult.total_amount})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-champagne/30 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-champagne/20 flex items-center justify-center">
                <PartyPopper className="text-champagne" size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy">
                  Group & Wedding Banquet Booking
                </h2>
                <p className="text-xs text-charcoal/60">
                  Reserve up to 50 Rooms + Grand Banquet Hall + Custom Catering
                </p>
              </div>
            </div>

            <form onSubmit={handleGroupBooking} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikramaditya Singh"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Event Type
                  </label>
                  <input
                    type="text"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Rooms Needed (Max 50)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={roomsRequired}
                    onChange={(e) => setRoomsRequired(Number(e.target.value))}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Banquet Guests (Max 500)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={500}
                    value={expectedGuests}
                    onChange={(e) => setExpectedGuests(Number(e.target.value))}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Event Check-In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal/70 uppercase">
                    Event Check-Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={banquetHall}
                    onChange={(e) => setBanquetHall(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Include Grand Banquet Hall
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catering}
                    onChange={(e) => setCatering(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Include Full Wedding Catering
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-navy hover:bg-charcoal text-champagne font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer"
              >
                Generate Group Quotation & Reserve Block
              </button>
            </form>

            {groupResult && (
              <div className="mt-6 p-5 bg-champagne/15 border border-champagne rounded-2xl text-sm space-y-1.5">
                <div className="flex items-center gap-2 text-navy font-bold text-base">
                  <CheckCircle2 className="text-success" size={20} /> Wedding / Group Block Created!
                </div>
                <p>
                  <strong>Group Reference:</strong> {groupResult.reference_code}
                </p>
                <p>
                  <strong>Block Size:</strong> {groupResult.rooms_required} Rooms +{" "}
                  {groupResult.expected_guests} Guests
                </p>
                <p>
                  <strong>Estimated Package Quote:</strong> ₹
                  {groupResult.estimated_amount.toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            GEMINI / CHATGPT STYLE LUXURY AI RECEPTIONIST MODAL ("AARADHYA")
           ===================================================================== */}
        {isChatOpen && (
          <div className="fixed inset-0 z-50 bg-navy/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
            <div className="bg-ivory w-full max-w-3xl h-[86vh] rounded-3xl shadow-2xl border-2 border-champagne/60 flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-navy via-charcoal to-navy px-6 py-4 flex items-center justify-between border-b border-champagne/30">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-champagne/20 border border-champagne flex items-center justify-center relative">
                    <Bot className="text-champagne" size={24} />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full ring-2 ring-navy"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white">
                        Aaradhya — Royal AI Receptionist
                      </h3>
                      <span className="text-[10px] bg-champagne/20 text-champagne border border-champagne/40 px-2 py-0.5 rounded-full font-bold uppercase">
                        Live 24/7
                      </span>
                    </div>
                    <p className="text-xs text-ivory/70">
                      Auto Room Booking • Room Service • Local Guide • Photo/Video & Voice Enabled
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsChatOpen(false);
                  }}
                  className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition"
                  title="Close Chat"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Chat History Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-ivory to-white">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.sender === "user"
                          ? "bg-navy text-white rounded-br-none"
                          : "bg-white text-charcoal border border-champagne/40 rounded-bl-none"
                      }`}
                    >
                      {msg.attachmentPreview && msg.attachmentType?.startsWith("image/") && (
                        <img
                          src={msg.attachmentPreview}
                          alt={msg.attachmentName}
                          className="w-48 h-36 object-cover rounded-xl mb-2 border border-white/20"
                        />
                      )}
                      {msg.attachmentPreview && msg.attachmentType?.startsWith("video/") && (
                        <video
                          src={msg.attachmentPreview}
                          controls
                          className="w-56 rounded-xl mb-2 border border-white/20"
                        />
                      )}
                      {msg.attachmentName &&
                        !msg.attachmentType?.startsWith("image/") &&
                        !msg.attachmentType?.startsWith("video/") && (
                          <div className="text-xs bg-white/15 px-3 py-1.5 rounded-lg mb-2 inline-block">
                            📄 {msg.attachmentName}
                          </div>
                        )}

                      <div className="whitespace-pre-line">{msg.content}</div>

                      {msg.sender === "ai" && msg.spoken && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-royal font-semibold">
                          <Volume2 size={13} /> Spoken via Voice Response
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {aiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-champagne/40 text-navy px-4 py-3 rounded-2xl rounded-bl-none text-xs font-semibold flex items-center gap-2 shadow-sm">
                      <Sparkles size={14} className="text-champagne animate-spin" />
                      Aaradhya is checking hotel system...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* 5 Instant Plugins Bar */}
              <div className="px-4 py-2.5 bg-ivory border-t border-gray-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {QUICK_PLUGINS.map((plugin, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessageToAI(plugin.prompt, false)}
                    className="shrink-0 text-xs font-semibold bg-white hover:bg-navy text-navy hover:text-champagne border border-champagne/50 px-3.5 py-1.5 rounded-full transition shadow-xs cursor-pointer"
                  >
                    {plugin.label}
                  </button>
                ))}
              </div>

              {attachment && (
                <div className="px-5 py-2 bg-champagne/15 border-t border-champagne/40 flex items-center justify-between text-xs text-navy font-semibold">
                  <span className="truncate">📎 Attached: {attachment.name}</span>
                  <button
                    onClick={() => setAttachment(null)}
                    className="text-red-600 hover:underline ml-3"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Bottom Input Bar */}
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
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-ivory hover:bg-champagne/20 text-navy transition border border-gray-200"
                  title="Upload Photo, Video, or Document"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening... Speak now (Reply will be in Voice + Text)"
                      : "Ask Aaradhya to book rooms, order food/water, or upload a photo..."
                  }
                  className="flex-1 px-4 py-3 bg-ivory/70 border border-gray-200 rounded-xl text-sm text-charcoal focus:outline-none focus:border-royal"
                />

                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-3 rounded-xl transition border ${
                    isListening
                      ? "bg-red-600 text-white border-red-600 animate-pulse"
                      : "bg-ivory hover:bg-royal/10 text-royal border-gray-200"
                  }`}
                  title="Speak with Voice (Replies in Voice + Text)"
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  type="submit"
                  disabled={aiTyping}
                  className="px-5 py-3 rounded-xl bg-navy hover:bg-royal text-champagne hover:text-white font-bold text-sm transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            PHASE 9: SECURE HMAC-VERIFIED HOTEL CHECKOUT MODAL
           ===================================================================== */}
        {bookingResult && (
          <SecurePaymentModal
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            module="hotel"
            sourceReference={bookingResult.booking_reference}
            guestName={bookingResult.guest_name}
            totalBillAmount={bookingResult.total_amount}
            defaultPolicy={
              paymentOption === "full_payment"
                ? "full_payment"
                : paymentOption === "advance_50"
                ? "advance_50"
                : "advance_20"
            }
            onPaymentSuccess={(tx) => {
              setBookingResult({
                ...bookingResult,
                payment_status: tx.balance_due === 0 ? "paid" : "advance_paid",
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
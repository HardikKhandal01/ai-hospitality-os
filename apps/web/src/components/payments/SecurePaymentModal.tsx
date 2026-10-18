"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck, Lock, CreditCard, Smartphone, Building, CheckCircle2, X } from "lucide-react";

interface SecurePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: "hotel" | "restaurant";
  sourceReference: string;
  guestName: string;
  totalBillAmount: number;
  defaultPolicy?: string;
  onPaymentSuccess: (verifiedTx: any) => void;
}

export default function SecurePaymentModal({
  isOpen,
  onClose,
  module,
  sourceReference,
  guestName,
  totalBillAmount,
  defaultPolicy = "advance_20",
  onPaymentSuccess,
}: SecurePaymentModalProps) {
  const [policy, setPolicy] = useState(defaultPolicy);
  const [method, setMethod] = useState("UPI QR / GPay / PhonePe");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifiedTx, setVerifiedTx] = useState<any>(null);
  const [error, setError] = useState("");

  // Hide Floating Dock when Payment Modal is open
  useEffect(() => {
    const dock = document.getElementById("floating-dock");
    if (dock && isOpen) {
      dock.style.display = "none";
    }
    return () => {
      if (dock) dock.style.display = "block";
    };
  }, [isOpen]);

  const initiateServerOrder = async (selectedPolicy: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          source_reference: sourceReference,
          guest_name: guestName,
          total_bill_amount: totalBillAmount,
          payment_policy: selectedPolicy,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderData(data);
      } else {
        setError(data.detail || "Could not create server payment order");
      }
    } catch (err) {
      setError("Backend payment gateway unreachable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && totalBillAmount > 0) {
      setVerifiedTx(null);
      setPolicy(defaultPolicy);
      initiateServerOrder(defaultPolicy);
    }
  }, [isOpen, totalBillAmount, defaultPolicy]);

  if (!isOpen) return null;

  const handleVerifyAndPay = async () => {
    if (!orderData) return;
    setLoading(true);
    setError("");
    try {
      const simulatedPaymentId = `pay_test_${orderData.gateway_order_id.slice(-8)}`;
      const res = await fetch("http://127.0.0.1:8000/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: orderData.transaction_id,
          gateway_order_id: orderData.gateway_order_id,
          gateway_payment_id: simulatedPaymentId,
          gateway_signature: orderData.test_signature_token,
          payment_method: method,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifiedTx(data);
        onPaymentSuccess(data);
      } else {
        setError(data.detail || "Signature verification failed!");
      }
    } catch (err) {
      setError("Error verifying payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-champagne overflow-hidden">
        
        {/* Top Security Header */}
        <div className="bg-gradient-to-r from-navy via-charcoal to-navy p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-champagne/20 border border-champagne flex items-center justify-center">
              <Lock className="text-champagne" size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-champagne font-bold flex items-center gap-1">
                <ShieldCheck size={12} /> HMAC-SHA256 Verified Gateway
              </span>
              <h3 className="text-base font-extrabold">Royal Haven Secure Checkout</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/80 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-charcoal">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {verifiedTx ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-extrabold text-navy">Payment Verified!</h4>
              <p className="text-xs text-charcoal/70">
                Cryptographic signature verified by backend server.
              </p>

              <div className="bg-ivory p-4 rounded-2xl border border-gray-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Receipt Ref:</span>
                  <span className="font-bold text-navy">{verifiedTx.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Booking / Table:</span>
                  <span className="font-bold text-navy">{verifiedTx.source_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Paid Now:</span>
                  <span className="font-extrabold text-success">₹{verifiedTx.amount_payable_now}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Balance Due at Checkout:</span>
                  <span className="font-bold text-navy">₹{verifiedTx.balance_due}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Gateway Order ID:</span>
                  <span className="font-mono text-[10px]">{verifiedTx.gateway_order_id}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-navy text-champagne font-bold py-3 rounded-xl text-sm shadow-lg cursor-pointer"
              >
                Done & Return
              </button>
            </div>
          ) : (
            <>
              {/* Summary Strip */}
              <div className="bg-ivory p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-charcoal/60 font-semibold">
                    {module === "hotel" ? "Hotel Reservation" : "Restaurant Table Tab"} ({sourceReference})
                  </p>
                  <p className="text-sm font-extrabold text-navy">Guest: {guestName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-charcoal/60 block">Total Bill</span>
                  <span className="text-lg font-extrabold text-navy">₹{totalBillAmount}</span>
                </div>
              </div>

              {/* Payment Split Policy Selector (For Hotel) */}
              {module === "hotel" && (
                <div>
                  <label className="text-[11px] font-bold uppercase text-charcoal/70 block mb-1.5">
                    Select Owner Payment Policy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "advance_20", label: "20% Advance" },
                      { id: "advance_50", label: "50% Advance" },
                      { id: "full_payment", label: "100% Full" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPolicy(opt.id);
                          initiateServerOrder(opt.id);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          policy === opt.id
                            ? "bg-navy text-champagne border-navy"
                            : "bg-white text-charcoal border-gray-200 hover:border-royal"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase text-charcoal/70 block mb-1.5">
                  Choose Payment Method (Test Sandbox)
                </label>
                <div className="space-y-2">
                  {[
                    { name: "UPI QR / GPay / PhonePe", icon: Smartphone },
                    { name: "Credit / Debit Card (Visa / MasterCard)", icon: CreditCard },
                    { name: "NetBanking (All Indian Banks)", icon: Building },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.name}
                        onClick={() => setMethod(m.name)}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                          method === m.name
                            ? "border-royal bg-royal/5 font-bold text-navy"
                            : "border-gray-200 text-charcoal/80 hover:bg-ivory"
                        }`}
                      >
                        <Icon size={18} className="text-royal" />
                        <span className="text-xs">{m.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payable Breakdown */}
              {orderData && (
                <div className="pt-2 border-t border-gray-200 text-xs space-y-1">
                  <div className="flex justify-between text-sm font-extrabold text-navy">
                    <span>Payable Right Now:</span>
                    <span className="text-royal text-base">₹{orderData.amount_payable_now}</span>
                  </div>
                  <div className="flex justify-between text-charcoal/60">
                    <span>Remaining Balance at Checkout:</span>
                    <span>₹{orderData.balance_due}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={loading || !orderData}
                onClick={handleVerifyAndPay}
                className="w-full bg-success hover:bg-success/90 text-white font-extrabold py-3.5 rounded-xl transition shadow-lg text-sm cursor-pointer"
              >
                {loading
                  ? "Verifying HMAC Signature..."
                  : `Pay ₹${orderData?.amount_payable_now || totalBillAmount} Securely`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
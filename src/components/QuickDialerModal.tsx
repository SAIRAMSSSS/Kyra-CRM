"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneCall,
  X,
  User,
  Clock,
  MapPin,
  Delete,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { CallReportModal } from "./CallReportModal";

interface QuickDialerModalProps {
  onClose: () => void;
}

export function QuickDialerModal({ onClose }: QuickDialerModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showCallReportModal, setShowCallReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"keypad" | "queue">("keypad");

  useEffect(() => {
    fetch("/api/leads?limit=10")
      .then((r) => r.json())
      .then((data) => {
        if (data.leads) setRecentLeads(data.leads);
      })
      .catch(console.error);
  }, []);

  const handleDigit = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleDialNumber = (leadToCall?: any) => {
    const targetLead = leadToCall || selectedLead;
    const phoneToDial = leadToCall ? leadToCall.customer.phone : phoneNumber;

    if (!phoneToDial || phoneToDial.trim().length < 6) {
      alert("Please enter or select a valid phone number to call.");
      return;
    }

    // Trigger telephone action
    window.open(`tel:${phoneToDial}`, "_self");

    // If lead object exists, open the Call Report modal
    if (targetLead) {
      setSelectedLead(targetLead);
      setShowCallReportModal(true);
    } else {
      // Find matching lead in recent leads if any
      const match = recentLeads.find(
        (l) => l.customer.phone.replace(/\D/g, "") === phoneToDial.replace(/\D/g, "")
      );
      if (match) {
        setSelectedLead(match);
        setShowCallReportModal(true);
      } else {
        // If unknown number, create a temporary lead context or notify
        if (recentLeads.length > 0) {
          setSelectedLead(recentLeads[0]);
          setShowCallReportModal(true);
        }
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">KYRA Telecaller Dialer</h3>
                <p className="text-[10px] text-slate-400">Click-to-Call & Immediate Log</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("keypad")}
              className={`py-1.5 rounded-lg transition-colors ${
                activeTab === "keypad"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Dial Pad
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`py-1.5 rounded-lg transition-colors ${
                activeTab === "queue"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Assigned Queue ({recentLeads.length})
            </button>
          </div>

          {/* Keypad View */}
          {activeTab === "keypad" && (
            <div className="p-5 space-y-4">
              {/* Phone display */}
              <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number..."
                  className="bg-transparent font-mono text-lg font-bold text-slate-900 outline-none w-full tracking-wider text-center"
                />
                {phoneNumber && (
                  <button
                    onClick={handleBackspace}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Number Buttons */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {[
                  { num: "1", sub: "" },
                  { num: "2", sub: "ABC" },
                  { num: "3", sub: "DEF" },
                  { num: "4", sub: "GHI" },
                  { num: "5", sub: "JKL" },
                  { num: "6", sub: "MNO" },
                  { num: "7", sub: "PQRS" },
                  { num: "8", sub: "TUV" },
                  { num: "9", sub: "WXYZ" },
                  { num: "*", sub: "" },
                  { num: "0", sub: "+" },
                  { num: "#", sub: "" },
                ].map((k) => (
                  <button
                    key={k.num}
                    type="button"
                    onClick={() => handleDigit(k.num)}
                    className="h-13 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-amber-100 border border-slate-200 text-slate-900 font-bold text-lg flex flex-col items-center justify-center transition-all shadow-xs"
                  >
                    <span>{k.num}</span>
                    {k.sub && <span className="text-[9px] font-normal text-slate-400 leading-none">{k.sub}</span>}
                  </button>
                ))}
              </div>

              {/* Call Action Button */}
              <button
                type="button"
                onClick={() => handleDialNumber()}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all mt-2"
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>Call Number & Log Report</span>
              </button>
            </div>
          )}

          {/* Queue View */}
          {activeTab === "queue" && (
            <div className="p-4 space-y-2 max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No assigned leads in queue.
                </div>
              ) : (
                recentLeads.map((l) => (
                  <div
                    key={l.id}
                    className="pt-2 pb-2 flex items-center justify-between gap-2 hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {l.customer?.name}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        {l.customer?.phone} • {l.customer?.location}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDialNumber(l)}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors flex-shrink-0"
                      title="Call Prospect"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Embedded Call Report Modal */}
      {showCallReportModal && selectedLead && (
        <CallReportModal
          lead={selectedLead}
          onClose={() => setShowCallReportModal(false)}
          onSuccess={() => {
            setShowCallReportModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  PhoneForwarded,
  UserCheck,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { formatWhatsAppUrl, formatTelUrl, formatMailtoUrl } from "@/lib/utils";

interface CallReportModalProps {
  lead: {
    id: string;
    displayId: string;
    enquiryNo?: string | null;
    customer: {
      name: string;
      phone: string;
      email?: string | null;
      location: string;
      profession?: string | null;
    };
    siteId?: string | null;
    site?: { id: string; name: string } | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function CallReportModal({ lead, onClose, onSuccess }: CallReportModalProps) {
  const [outcome, setOutcome] = useState("Answered");
  const [feedback, setFeedback] = useState<string>("CONFIRM");
  const [notes, setNotes] = useState("");
  const [notInterestedReason, setNotInterestedReason] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  // Site visit fixed / not fixed state
  const [siteVisitFixed, setSiteVisitFixed] = useState(true);
  const [siteVisitDate, setSiteVisitDate] = useState("");
  const [siteVisitTime, setSiteVisitTime] = useState("10:30 AM");
  const [siteVisitSiteId, setSiteVisitSiteId] = useState(lead.siteId || "");
  const [siteVisitRemarks, setSiteVisitRemarks] = useState("");
  const [assignedSiteManagerId, setAssignedSiteManagerId] = useState("");

  const [sites, setSites] = useState<{ id: string; name: string; location: string }[]>([]);
  const [siteManagers, setSiteManagers] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptLogged, setAttemptLogged] = useState(false);

  useEffect(() => {
    // Load project sites
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        if (data.sites) {
          setSites(data.sites);
          if (!siteVisitSiteId && data.sites.length > 0) {
            setSiteVisitSiteId(data.sites[0].id);
          }
        }
      })
      .catch(console.error);

    // Load site managers
    fetch("/api/employees?role=SITE_MANAGER")
      .then((res) => res.json())
      .then((data) => {
        if (data.employees && data.employees.length > 0) {
          setSiteManagers(data.employees);
          setAssignedSiteManagerId(data.employees[0].id);
        }
      })
      .catch(console.error);
  }, [siteVisitSiteId]);

  const handleInitiateCall = async () => {
    try {
      // Record call attempt in DB
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          actionType: "LOG_ATTEMPT",
          outcome: "Attempted",
          notes: "Initiated call via portal telephone action.",
        }),
      });
      setAttemptLogged(true);
      // Trigger tel: link
      window.open(formatTelUrl(lead.customer.phone), "_self");
    } catch (err) {
      console.error("Error logging attempt:", err);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = formatWhatsAppUrl(lead.customer.phone, lead.customer.name, lead.site?.name);
    window.open(url, "_blank");
  };

  const handleOpenEmail = () => {
    if (lead.customer.email) {
      const url = formatMailtoUrl(lead.customer.email, lead.customer.name, lead.site?.name);
      window.open(url, "_blank");
    } else {
      alert("Customer email address is not recorded for this contact.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isConfirmType = feedback === "CONFIRM" || feedback === "INTERESTED";

      if (feedback === "CALL_BACK" && !nextFollowUpDate) {
        throw new Error("Please select a follow-up callback date and time.");
      }

      if (isConfirmType && siteVisitFixed) {
        if (!siteVisitDate) {
          throw new Error("Please specify the fixed site-visit inspection date.");
        }
        if (!siteVisitTime) {
          throw new Error("Please select the site-visit time slot.");
        }
        if (!siteVisitSiteId) {
          throw new Error("Please select the property site to be visited.");
        }
      }

      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          actionType: "SUBMIT_REPORT",
          outcome,
          feedback,
          notes,
          notInterestedReason,
          nextFollowUpDate: nextFollowUpDate || null,
          siteVisitFixed: isConfirmType ? siteVisitFixed : null,
          siteVisitDate: isConfirmType && siteVisitFixed ? siteVisitDate : null,
          siteVisitTime: isConfirmType && siteVisitFixed ? siteVisitTime : null,
          siteVisitSiteId: isConfirmType && siteVisitFixed ? siteVisitSiteId : null,
          siteVisitRemarks: isConfirmType && siteVisitFixed ? siteVisitRemarks : null,
          assignedSiteManagerId: isConfirmType && siteVisitFixed ? assignedSiteManagerId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit call report");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isConfirmFeedback = feedback === "CONFIRM" || feedback === "INTERESTED";
  const isCallBackFeedback =
    feedback === "CALL_BACK" || feedback === "CALL_BUSY" || feedback === "SWITCHED_OFF";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base">Record Call Outreach & Outcome</h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-mono">
              {lead.enquiryNo ? (
                <span className="font-bold text-amber-400 mr-1.5">{lead.enquiryNo}</span>
              ) : null}
              {lead.displayId} • {lead.customer.name} ({lead.customer.location})
              {lead.customer.profession && (
                <span className="text-slate-400 font-sans ml-1">
                  • {lead.customer.profession}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telecaller Communication Action Bar (Call / via / Email / WP) */}
        <div className="px-6 py-3.5 bg-amber-50/80 border-b border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold text-amber-900 block text-[11px] uppercase tracking-wider">
                Customer Phone & Place:
              </span>
              <span className="font-mono text-amber-950 text-sm font-bold">
                {lead.customer.phone}
              </span>
              <span className="text-amber-800 text-xs ml-2">({lead.customer.location})</span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider px-2 py-0.5 bg-amber-100/80 rounded border border-amber-300/80">
              Call Option Flow
            </span>
          </div>

          {/* Interactive Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {/* [ Call ] */}
            <button
              type="button"
              onClick={handleInitiateCall}
              className="flex-1 crm-button-primary bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs py-2 px-3 shadow-xs flex items-center justify-center gap-1.5"
              title="Click to Call via softphone or device dialer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{attemptLogged ? "Call Again" : "Call"}</span>
            </button>

            {/* [ WP ] */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              title="Open WhatsApp Chat with pre-filled property greeting"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WP (WhatsApp)</span>
            </button>

            {/* [ Email ] */}
            <button
              type="button"
              onClick={handleOpenEmail}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              title="Send Email with project brochure template"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Call Report Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Call Connection Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="crm-input"
              >
                <option value="Answered">Answered (Connected)</option>
                <option value="Busy">Busy</option>
                <option value="Ringing Unanswered">Ringing Unanswered</option>
                <option value="Switched Off">Switched Off / Unreachable</option>
                <option value="Invalid Number">Invalid Number</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Mandatory Feedback Status
              </label>
              <select
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="crm-input font-bold text-slate-900"
              >
                <option value="CONFIRM">Confirm (Site Visit / Deal Fixed)</option>
                <option value="CALL_BACK">Call back</option>
                <option value="NOT_INTERESTED">N.I (Not Interested)</option>
                <option value="NOT_CONNECTED">N.Con (Not Connected)</option>
                <option value="CALL_BUSY">Call busy</option>
                <option value="SWITCHED_OFF">Switched off</option>
                <option value="OTHERS">Others</option>
              </select>
            </div>
          </div>

          {/* Conditional Workflow 1: Call Back / Busy / Switched off */}
          {isCallBackFeedback && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <label className="block font-semibold text-amber-900">
                Scheduled Call Back Date & Time {feedback === "CALL_BACK" ? "(Required)" : "(Recommended)"}
              </label>
              <input
                type="datetime-local"
                required={feedback === "CALL_BACK"}
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="crm-input bg-white"
              />
              <p className="text-[11px] text-amber-700">
                This lead will be highlighted in your priority callback queue on this date.
              </p>
            </div>
          )}

          {/* Conditional Workflow 2: Not Connected */}
          {feedback === "NOT_CONNECTED" && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-semibold text-slate-700">
                Optional Next Retry Date & Time
              </label>
              <input
                type="datetime-local"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="crm-input bg-white"
              />
            </div>
          )}

          {/* Conditional Workflow 3: Not Interested */}
          {feedback === "NOT_INTERESTED" && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
              <label className="block font-semibold text-rose-900">
                Reason for Not Interested (N.I)
              </label>
              <select
                value={notInterestedReason}
                onChange={(e) => setNotInterestedReason(e.target.value)}
                className="crm-input bg-white"
              >
                <option value="">Select Reason...</option>
                <option value="Budget mismatch">Budget mismatch</option>
                <option value="Location not preferred">Location not preferred</option>
                <option value="Purchased elsewhere">Purchased elsewhere</option>
                <option value="Just exploring / casual enquiry">Casual enquiry only</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Conditional Workflow 4: CONFIRM -> Site Visit Fixed or Not Fixed */}
          {isConfirmFeedback && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    Is the Site Visit Fixed?
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    Has the prospect agreed to a specific inspection appointment?
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSiteVisitFixed(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      siteVisitFixed
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setSiteVisitFixed(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      !siteVisitFixed
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Not Fixed
                  </button>
                </div>
              </div>

              {/* If Fixed -> Show Site Visit Fields */}
              {siteVisitFixed ? (
                <div className="pt-3 border-t border-emerald-200/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-emerald-950 mb-1">
                        Site Visit Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={siteVisitDate}
                        onChange={(e) => setSiteVisitDate(e.target.value)}
                        className="crm-input bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-emerald-950 mb-1">
                        Inspection Time Slot *
                      </label>
                      <select
                        value={siteVisitTime}
                        onChange={(e) => setSiteVisitTime(e.target.value)}
                        className="crm-input bg-white"
                      >
                        <option value="09:30 AM">09:30 AM (Morning Slot)</option>
                        <option value="10:30 AM">10:30 AM (Morning Slot)</option>
                        <option value="11:30 AM">11:30 AM (Midday Slot)</option>
                        <option value="02:30 PM">02:30 PM (Afternoon Slot)</option>
                        <option value="04:00 PM">04:00 PM (Sunset Slot)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-emerald-950 mb-1">
                        Project Site *
                      </label>
                      <select
                        value={siteVisitSiteId}
                        onChange={(e) => setSiteVisitSiteId(e.target.value)}
                        className="crm-input bg-white"
                        required
                      >
                        <option value="">Select Project Site...</option>
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.location})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-emerald-950 mb-1">
                        Assigned Site Manager
                      </label>
                      <select
                        value={assignedSiteManagerId}
                        onChange={(e) => setAssignedSiteManagerId(e.target.value)}
                        className="crm-input bg-white"
                      >
                        {siteManagers.map((sm) => (
                          <option key={sm.id} value={sm.id}>
                            {sm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-emerald-950 mb-1">
                      Site Visit Remarks (e.g. transport, family members)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Client coming with family in private car, needs perimeter tour."
                      value={siteVisitRemarks}
                      onChange={(e) => setSiteVisitRemarks(e.target.value)}
                      className="crm-input bg-white"
                    />
                  </div>
                </div>
              ) : (
                /* If Not Fixed */
                <div className="pt-2 border-t border-emerald-200/80 space-y-2">
                  <label className="block font-semibold text-slate-700">
                    Follow-Up Date to Fix Site Visit Later
                  </label>
                  <input
                    type="datetime-local"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="crm-input bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Client saved as Interested. Site visit remains unbooked pending confirmation.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* General Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Discussion Notes & Key Customer Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record details regarding client preferences, plot sizes, budget, or irrigation questions..."
              className="crm-input resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="crm-button-secondary py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
            >
              {loading ? "Submitting..." : "Save Call Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

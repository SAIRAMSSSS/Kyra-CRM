"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PhoneCall,
  User,
  MapPin,
  Building,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  History,
  Tag,
  Share2,
  Edit3,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CallReportModal } from "@/components/CallReportModal";
import { AssignLeadModal } from "@/components/AssignLeadModal";
import { formatDate, formatDateTime, formatWhatsAppUrl, formatMailtoUrl } from "@/lib/utils";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) {
        throw new Error("Lead not found or unauthorized.");
      }
      const data = await res.json();
      setLead(data.lead);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load lead</h2>
        <p className="text-xs text-slate-500">{error || "Record does not exist or access restricted."}</p>
        <Link href="/leads" className="crm-button-primary text-xs py-2 px-4 inline-block">
          Return to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/leads"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leads</span>
          </Link>
          <div className="flex items-center gap-3">
            {lead.enquiryNo && (
              <span className="font-mono font-bold text-sm bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-md shadow-2xs">
                {lead.enquiryNo}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {lead.displayId}
            </h1>
            <StatusBadge status={lead.lifecycleStatus} />
            <StatusBadge status={lead.priority} />
            {lead.callFeedback && <StatusBadge status={lead.callFeedback} />}
          </div>
        </div>

        {/* Action Buttons: [ Call ] [ WP ] [ Email ] [ Reassign ] */}
        <div className="flex flex-wrap items-center gap-2">
          {/* [ Call ] */}
          <button
            onClick={() => setShowCallModal(true)}
            className="crm-button-primary bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs py-2 px-3.5 shadow-sm flex items-center gap-1.5"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Customer</span>
          </button>

          {/* [ WP ] */}
          <a
            href={formatWhatsAppUrl(lead.customer.phone, lead.customer.name, lead.site?.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WP (WhatsApp)</span>
          </a>

          {/* [ Email ] */}
          <a
            href={formatMailtoUrl(lead.customer.email || "", lead.customer.name, lead.site?.name)}
            onClick={(e) => {
              if (!lead.customer.email) {
                e.preventDefault();
                alert("No email address recorded for this customer.");
              }
            }}
            className={`font-bold text-xs py-2 px-3 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors ${
              lead.customer.email
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>Email</span>
          </a>

          <button
            onClick={() => setShowAssignModal(true)}
            className="crm-button-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-slate-600" />
            <span>Reassign</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column Customer & Business Meta; Right Column Call History & Site Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Customer 360 Card */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="crm-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                  {lead.customer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">{lead.customer.name}</h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {lead.customer.id.substring(0, 10)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Phone Number
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <a
                    href={`tel:${lead.customer.phone}`}
                    className="font-mono font-bold text-slate-900 hover:text-amber-700 text-sm underline"
                  >
                    {lead.customer.phone}
                  </a>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>

              {lead.customer.altPhone && (
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                    Alternate Phone
                  </span>
                  <p className="font-mono text-slate-700 mt-0.5">{lead.customer.altPhone}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Profession / Occupation
                </span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {lead.customer.profession || <span className="text-slate-400 font-normal italic">Not specified</span>}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Location / City (PLACE)
                </span>
                <p className="text-slate-800 font-medium mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {lead.customer.location}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Preferred Contact Time (TIME)
                </span>
                <p className="text-slate-800 font-medium mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {lead.preferredTime || "10:30 AM (Standard Calling Hours)"}
                </p>
              </div>

              {lead.customer.address && (
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                    Address
                  </span>
                  <p className="text-slate-700 mt-0.5">{lead.customer.address}</p>
                </div>
              )}

              {lead.customer.email && (
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                    Email
                  </span>
                  <p className="text-slate-700 mt-0.5">{lead.customer.email}</p>
                </div>
              )}

              {lead.metaPlatform && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                    <Share2 className="w-3 h-3 text-blue-600" />
                    <span>Meta Ad Attribution: {lead.metaPlatform}</span>
                  </div>
                  <p className="text-[10px] text-blue-800 mt-0.5">
                    Campaign: {lead.metaCampaignName || "Direct"} • Ad: {lead.metaAdName || "Instant Form"}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Preferred Contact
                </span>
                <p className="text-slate-700 mt-0.5">{lead.customer.preferredContact || "Phone"}</p>
              </div>
            </div>
          </div>

          {/* Lead Business & Assignment Card */}
          <div className="crm-card p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs pb-2 border-b border-slate-100">
              Inquiry & Operations Meta
            </h3>

            <div className="space-y-2.5">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Selected Project Site
                </span>
                <p className="text-slate-900 font-bold mt-0.5">
                  {lead.site?.name || <span className="text-slate-400 italic">No site selected</span>}
                </p>
                {lead.site?.location && (
                  <span className="text-[11px] text-slate-500">{lead.site.location}</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Assigned Telecaller
                </span>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {lead.assignedTelecaller?.name || (
                    <span className="text-rose-600 font-bold">Unassigned</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Call Feedback Status
                </span>
                <div className="mt-1">
                  <StatusBadge status={lead.callFeedback} />
                </div>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Next Follow-up Due
                </span>
                <p className="text-slate-800 font-mono mt-0.5">
                  {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : "None scheduled"}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Lead Acquisition Source
                </span>
                <p className="text-slate-700 mt-0.5">
                  {lead.leadSource?.name || "Organic / Direct Referral"}
                </p>
              </div>

              {lead.campaign && (
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                    Marketing Campaign
                  </span>
                  <p className="text-slate-700 mt-0.5 font-medium">{lead.campaign.name}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Registered On
                </span>
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                  {formatDateTime(lead.createdAt)}
                </p>
              </div>

              {lead.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                    Notes
                  </span>
                  <p className="text-slate-700 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                    {lead.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Call History & Site Visits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Site Visits fixed for this customer */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Site Visit Appointments
                </h2>
              </div>
              <Link
                href="/site-visits"
                className="text-xs text-amber-700 hover:text-amber-800 font-medium"
              >
                All Site Visits &rarr;
              </Link>
            </div>

            {lead.siteVisits?.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200/60">
                No site visits fixed yet. Select <strong>Interested &rarr; Fixed</strong> when logging a call report to schedule an inspection.
              </div>
            ) : (
              <div className="space-y-3">
                {lead.siteVisits.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950">
                          {v.displayId}
                        </span>
                        <StatusBadge status={v.status} />
                      </div>
                      <p className="font-semibold text-slate-900">
                        {v.site?.name} • {formatDate(v.scheduledDate)} at {v.scheduledTime}
                      </p>
                      {v.visitRemarks && (
                        <p className="text-slate-600 text-[11px] bg-white/80 p-2 rounded border border-emerald-100">
                          <strong>Remarks:</strong> {v.visitRemarks}
                        </p>
                      )}
                      {v.completionNotes && (
                        <p className="text-emerald-800 text-[11px] bg-emerald-100/60 p-2 rounded">
                          <strong>Completed:</strong> {v.completionNotes}
                        </p>
                      )}
                    </div>
                    <div className="text-right self-end sm:self-auto">
                      <span className="text-[11px] text-slate-500 block">
                        Site Mgr: {v.assignedSiteManager?.name || "Unassigned"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call Reports & Outreach Timeline */}
          <div className="crm-card p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Outreach Call History & Interaction Log
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {lead.callReports?.length || 0} interaction(s)
              </span>
            </div>

            {lead.callReports?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200/60">
                No calls recorded yet. Use the <strong>Call Customer</strong> button above to start telecalling.
              </div>
            ) : (
              <div className="space-y-3">
                {lead.callReports.map((call: any) => (
                  <div
                    key={call.id}
                    className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-2 text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {call.telecaller?.name || "Telecaller"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {call.outcome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={call.feedback} />
                        <span className="font-mono text-[11px] text-slate-400">
                          {formatDateTime(call.calledAt)}
                        </span>
                      </div>
                    </div>

                    {call.notes && (
                      <p className="text-slate-700 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                        {call.notes}
                      </p>
                    )}

                    {call.notInterestedReason && (
                      <p className="text-rose-700 text-xs bg-rose-50 p-2 rounded">
                        <strong>Declined Reason:</strong> {call.notInterestedReason}
                      </p>
                    )}

                    {call.nextFollowUpDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Callback Set: {formatDateTime(call.nextFollowUpDate)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reassignment Audit History */}
          {lead.assignmentHistories?.length > 0 && (
            <div className="crm-card p-5">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Lead Assignment History
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {lead.assignmentHistories.map((hist: any) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-slate-600"
                  >
                    <div>
                      <span>Assigned to </span>
                      <strong className="text-slate-900">{hist.toUser?.name}</strong>
                      {hist.notes && <span className="text-slate-400 text-[11px]"> — {hist.notes}</span>}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {formatDate(hist.assignedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call Report Modal */}
      {showCallModal && (
        <CallReportModal
          lead={lead}
          onClose={() => setShowCallModal(false)}
          onSuccess={() => {
            setShowCallModal(false);
            fetchLead();
          }}
        />
      )}

      {/* Reassign Lead Modal */}
      {showAssignModal && (
        <AssignLeadModal
          leadIds={[lead.id]}
          currentAssigneeName={lead.assignedTelecaller?.name}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            fetchLead();
          }}
        />
      )}
    </div>
  );
}

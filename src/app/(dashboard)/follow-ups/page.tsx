"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, PhoneCall, AlertTriangle, CheckCircle, MapPin, Building, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime, isDateOverdue } from "@/lib/utils";

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads?status=FOLLOW_UP_REQUIRED")
      .then((r) => r.json())
      .then((data) => {
        // Also fetch any leads with feedback CALL_BACK or nextFollowUpAt
        if (data.leads) {
          setLeads(data.leads.filter((l: any) => l.nextFollowUpAt));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const overdue = leads.filter((l) => isDateOverdue(l.nextFollowUpAt));
  const upcoming = leads.filter((l) => !isDateOverdue(l.nextFollowUpAt));

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Follow-up & Callback Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Timely customer reconnection commitments scheduled during previous call outcomes.
        </p>
      </div>

      {/* Overdue Callbacks */}
      {overdue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
              Overdue Callbacks ({overdue.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdue.map((l) => (
              <div
                key={l.id}
                className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-950">
                    {l.displayId}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Overdue
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{l.customer.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {l.customer.location} • {l.site?.name || "General"}
                  </p>
                  <p className="font-mono text-xs text-rose-800 font-semibold mt-1">
                    Due: {formatDateTime(l.nextFollowUpAt)}
                  </p>
                </div>

                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Assigned: {l.assignedTelecaller?.name || "Unassigned"}
                  </span>
                  <Link
                    href={`/leads/${l.displayId}`}
                    className="crm-button-primary bg-rose-600 hover:bg-rose-700 text-xs py-1 px-3"
                  >
                    Call Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Follow-ups */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Scheduled Upcoming Callbacks ({upcoming.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading follow-up queue...
          </div>
        ) : upcoming.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">All callbacks are up to date!</p>
            <p className="text-slate-500 text-xs mt-0.5">
              No pending callbacks due in this queue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((l) => (
              <div
                key={l.id}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {l.displayId}
                  </span>
                  <StatusBadge status={l.priority} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{l.customer.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {l.customer.location} • {l.site?.name || "General"}
                  </p>
                  <p className="font-mono text-xs text-amber-800 font-semibold mt-1">
                    Scheduled: {formatDateTime(l.nextFollowUpAt)}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {l.assignedTelecaller?.name || "Unassigned"}
                  </span>
                  <Link
                    href={`/leads/${l.displayId}`}
                    className="crm-button-secondary text-xs py-1 px-3 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                    <span>Open & Call</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

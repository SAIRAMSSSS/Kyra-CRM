"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Clock,
  ThumbsUp,
  PhoneOff,
  CalendarCheck,
  ArrowRight,
  PhoneForwarded,
  User,
  MapPin,
  Building,
} from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";

export function TelecallerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error loading Telecaller dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Telecalling Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Assigned customer outreach, call outcome logging, callbacks, and site visit scheduling.
          </p>
        </div>
        <Link
          href="/leads"
          className="crm-button-primary flex items-center gap-1.5 text-xs py-2"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Open My Assigned Queue</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Queue
            </span>
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.myAssignedLeadsCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Calls pending today: <strong className="text-amber-600">{m.callsPendingCount ?? 0}</strong>
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Calls Logged Today
            </span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.callsTodayCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Interested converted: <strong>{m.interestedCount ?? 0}</strong>
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Callbacks Due Today
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700">
            {m.callBacksDueTodayCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Scheduled time commitments</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Site Visits Fixed
            </span>
            <CalendarCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-purple-700">
            {m.siteVisitsFixedByMe ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Direct inspections booked</div>
        </div>
      </div>

      {/* Callbacks Due Today */}
      <div className="crm-card p-5 border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Priority Callbacks Due Today
            </h2>
          </div>
          <span className="text-xs text-amber-800 font-medium">
            {data?.callBacksDueToday?.length || 0} callbacks scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.callBacksDueToday?.length === 0 ? (
            <div className="col-span-2 py-4 text-center text-xs text-slate-400">
              No callbacks due right now. Ready to contact fresh leads from your queue!
            </div>
          ) : (
            data?.callBacksDueToday?.map((l: any) => (
              <div
                key={l.id}
                className="p-3.5 bg-white border border-amber-200 rounded-lg shadow-sm flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{l.customer?.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {l.customer?.location} • {l.site?.name || "General inquiry"}
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
                    Scheduled Callback: {formatDateTime(l.nextFollowUpAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Link
                    href={`/leads/${l.displayId}`}
                    className="crm-button-primary text-xs py-1.5 px-3 flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Urgent Leads Queue & Recent Call History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Leads to Call */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Priority Leads in Your Queue
            </h2>
            <Link href="/leads" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
              Full Queue &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.urgentLeads?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No pending leads in your queue.</p>
            ) : (
              data?.urgentLeads?.map((l: any) => (
                <div
                  key={l.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{l.customer?.name}</span>
                      <StatusBadge status={l.priority} />
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {l.site?.name || "General"} • {l.customer?.location}
                    </p>
                  </div>
                  <Link
                    href={`/leads/${l.displayId}`}
                    className="crm-button-secondary text-xs py-1 px-2.5"
                  >
                    Details & Call
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Call Outcomes */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              My Recent Call History
            </h2>
            <Link href="/call-reports" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
              All Call Reports &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentCalls?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No calls logged yet today.</p>
            ) : (
              data?.recentCalls?.map((call: any) => (
                <div
                  key={call.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-semibold text-slate-900">
                      {call.lead?.customer?.name}
                    </p>
                    <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                      {call.notes || "No notes recorded"}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      {formatDateTime(call.calledAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={call.feedback} />
                    {call.siteVisitFixed && (
                      <span className="block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Visit Fixed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

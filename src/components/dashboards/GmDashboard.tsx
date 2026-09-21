"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  PhoneCall,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building,
  ShieldAlert,
  Download,
  Filter,
} from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";

export function GmDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("month");

  const fetchDashboardData = async (filter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?filter=${filter}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load GM dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateFilter);
  }, [dateFilter]);

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
      {/* Header & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Organization Overview & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time operational metrics across marketing, lead conversion, calling, and site visits.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-auto">
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "all", label: "All Time" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                dateFilter === item.id
                  ? "bg-white text-slate-900 font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inquiries
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.totalLeads ?? 0}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>New: <strong>{m.newLeads ?? 0}</strong></span>
            <span>Unassigned: <strong className="text-amber-600">{m.unassignedLeads ?? 0}</strong></span>
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Interested Prospects
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.interestedLeads ?? 0}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Site Visits Fixed: <strong className="text-emerald-700">{m.siteVisitsFixed ?? 0}</strong></span>
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Follow-ups Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.followUpLeads ?? 0}</p>
          <div className="mt-2 text-xs text-slate-500 truncate">
            Requires active telecaller reconnect
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Site Visits
            </span>
            <CheckCircle className="w-4 h-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.siteVisitsCompleted ?? 0}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Pending inspection: <strong>{m.siteVisitsPending ?? 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Telecaller Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Conversion Funnel */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Lead Conversion Pipeline
            </h2>
            <span className="text-xs text-slate-500">Live Stage Counts</span>
          </div>

          <div className="space-y-3">
            {data?.conversionFunnel?.map((step: any, idx: number) => {
              const maxCount = Math.max(1, data.conversionFunnel[0]?.count || 1);
              const pct = Math.round((step.count / maxCount) * 100);
              return (
                <div key={step.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {idx + 1}. {step.stage}
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {step.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telecaller Workload & Productivity */}
        <div className="crm-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Telecaller Operations
            </h2>
            <Link
              href="/reports"
              className="text-xs text-amber-700 hover:text-amber-800 font-medium"
            >
              Detailed Report &rarr;
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-semibold">Specialist</th>
                  <th className="pb-2 font-semibold text-right">Assigned Leads</th>
                  <th className="pb-2 font-semibold text-right">Total Calls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.telecallerActivity?.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
                      No active telecallers found.
                    </td>
                  </tr>
                ) : (
                  data?.telecallerActivity?.map((t: any) => (
                    <tr key={t.name} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-medium text-slate-800">{t.name}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">{t.leads}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                        {t.calls}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Leads by Source & Leads by Site */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="crm-card p-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Leads By Promotional Channel
          </h2>
          <div className="space-y-2.5">
            {data?.leadsBySource?.length === 0 ? (
              <p className="text-xs text-slate-400">No source data recorded yet.</p>
            ) : (
              data?.leadsBySource?.map((src: any) => (
                <div
                  key={src.name}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs"
                >
                  <span className="font-medium text-slate-700">{src.name}</span>
                  <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    {src.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="crm-card p-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Leads By Project Site
          </h2>
          <div className="space-y-2.5">
            {data?.leadsBySite?.length === 0 ? (
              <p className="text-xs text-slate-400">No project site data recorded yet.</p>
            ) : (
              data?.leadsBySite?.map((site: any) => (
                <div
                  key={site.name}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs"
                >
                  <span className="font-medium text-slate-700">{site.name}</span>
                  <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    {site.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Site Visits & Outstanding Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Visits */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Upcoming Fixed Site Visits
            </h2>
            <Link
              href="/site-visits"
              className="text-xs text-amber-700 hover:text-amber-800 font-medium"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.upcomingVisits?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No upcoming site visits scheduled.</p>
            ) : (
              data?.upcomingVisits?.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{v.customer?.name}</p>
                    <p className="text-slate-500 text-[11px]">
                      {v.site?.name} • {formatDate(v.scheduledDate)} at {v.scheduledTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={v.status} />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mgr: {v.assignedSiteManager?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outstanding Operational Tasks */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Outstanding Work Tasks
            </h2>
            <Link
              href="/tasks"
              className="text-xs text-amber-700 hover:text-amber-800 font-medium"
            >
              Task Board &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.outstandingTasks?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">All tasks are currently completed!</p>
            ) : (
              data?.outstandingTasks?.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-medium text-slate-800 line-clamp-1">{t.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assigned to: {t.assignedTo?.name} • Due: {formatDate(t.dueDate)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="crm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              System Audit Trail (Recent Activity)
            </h2>
          </div>
          <Link
            href="/audit-logs"
            className="text-xs text-amber-700 hover:text-amber-800 font-medium"
          >
            Full Audit Logs &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-semibold">Timestamp</th>
                <th className="pb-2 font-semibold">User</th>
                <th className="pb-2 font-semibold">Action</th>
                <th className="pb-2 font-semibold">Entity</th>
                <th className="pb-2 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentActivity?.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-2 text-slate-500 font-mono text-[11px]">
                    {formatDateTime(a.createdAt)}
                  </td>
                  <td className="py-2 font-medium text-slate-800">
                    {a.user ? a.user.name : "System"}
                  </td>
                  <td className="py-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {a.action}
                    </span>
                  </td>
                  <td className="py-2 text-slate-600">{a.entityType}</td>
                  <td className="py-2 text-slate-400 font-mono text-[11px]">
                    {a.ipAddress || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Upload,
  PhoneCall,
  Clock,
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Send,
} from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { formatDate } from "@/lib/utils";

export function CrmExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error loading CRM dashboard:", err))
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
      {/* Header & Quick Intake Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            CRM Operations & Telecaller Coordination
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Intake leads, assign prospects to telecallers, coordinate follow-ups, and monitor conversion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leads/new"
            className="crm-button-primary flex items-center gap-1.5 text-xs py-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Single Lead</span>
          </Link>
          <Link
            href="/leads?action=import"
            className="crm-button-secondary flex items-center gap-1.5 text-xs py-2"
          >
            <Upload className="w-4 h-4" />
            <span>CSV Bulk Import</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Leads Under Mgmt
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.totalLeads ?? 0}</p>
          <div className="mt-2 text-xs text-slate-500">
            Assigned: <strong>{m.assignedLeads ?? 0}</strong>
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unassigned Leads
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-rose-600">
            {m.unassignedLeads ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            <Link href="/leads?status=unassigned" className="text-rose-600 font-semibold hover:underline">
              Assign to telecallers &rarr;
            </Link>
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Follow-ups Due Today
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.followUpTodayCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Scheduled callbacks for today
          </div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Site Visits Fixed
            </span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.siteVisitsFixedCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Interested customers: <strong>{m.interestedCount ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* Telecaller Workload Section */}
      <div className="crm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Telecaller Team Workload & Allocation
            </h2>
            <p className="text-xs text-slate-500">
              Review current queue capacity before delegating new incoming leads
            </p>
          </div>
          <Link
            href="/leads"
            className="crm-button-secondary text-xs py-1.5 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-slate-600" />
            <span>Assign Work</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data?.telecallerWorkload?.map((tc: any) => (
            <div
              key={tc.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{tc.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Telecalling Specialist</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Current Leads
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {tc.assignedLeads}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Total Calls
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {tc.totalCalls}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Lead Inflow */}
      <div className="crm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Leads Intake
          </h2>
          <Link href="/leads" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
            View All Leads &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-semibold">Lead ID</th>
                <th className="pb-2 font-semibold">Customer</th>
                <th className="pb-2 font-semibold">Location</th>
                <th className="pb-2 font-semibold">Selected Site</th>
                <th className="pb-2 font-semibold">Assigned Caller</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentLeads?.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono text-slate-500">{l.displayId}</td>
                  <td className="py-2.5 font-semibold text-slate-900">{l.customer?.name}</td>
                  <td className="py-2.5 text-slate-600">{l.customer?.location}</td>
                  <td className="py-2.5 text-slate-700">{l.site?.name || "Unassigned"}</td>
                  <td className="py-2.5 text-slate-600">
                    {l.assignedTelecaller?.name ? (
                      <span className="font-medium text-slate-800">{l.assignedTelecaller.name}</span>
                    ) : (
                      <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={l.lifecycleStatus} />
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/leads/${l.displayId}`}
                      className="text-amber-700 hover:text-amber-800 font-medium underline"
                    >
                      Open &rarr;
                    </Link>
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

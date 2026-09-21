"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, PlusCircle, Users, BarChart2, Layers, ArrowRight, CheckSquare } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { formatDate } from "@/lib/utils";

export function DigitalHeadDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error loading DH dashboard:", err))
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Marketing & Lead Generation Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Promotional campaigns tracking, marketing channel yield, and incoming lead distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/campaigns"
            className="crm-button-primary flex items-center gap-1.5 text-xs py-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Campaigns
            </span>
            <Megaphone className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.activeCampaignsCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Promotions currently running</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Leads Generated
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.totalLeads ?? 0}</p>
          <div className="mt-2 text-xs text-slate-500">Across all active campaigns</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned to CRM/Callers
            </span>
            <BarChart2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.assignedLeads ?? 0}</p>
          <div className="mt-2 text-xs text-slate-500">In telecaller contact cycle</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Awaiting CRM Intake
            </span>
            <Layers className="w-4 h-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{m.unassignedLeads ?? 0}</p>
          <div className="mt-2 text-xs text-slate-500">Pending telecaller assignment</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="crm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Promotional Campaigns Performance
            </h2>
            <p className="text-xs text-slate-500">Content media & lead yield</p>
          </div>
          <Link
            href="/campaigns"
            className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
          >
            <span>Manage Campaigns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-semibold">Campaign Name</th>
                <th className="pb-2 font-semibold">Content Type</th>
                <th className="pb-2 font-semibold">Platform</th>
                <th className="pb-2 font-semibold">Source</th>
                <th className="pb-2 font-semibold text-right">Leads Acquired</th>
                <th className="pb-2 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.campaigns?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    No active campaigns. Create your first campaign above.
                  </td>
                </tr>
              ) : (
                data?.campaigns?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 text-slate-600">{c.contentType}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                        {c.platform}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{c.leadSource || "Direct"}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {c.leadsCount}
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Leads & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Inflow of Leads
            </h2>
            <Link href="/leads" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
              All Leads &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {data?.recentLeads?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No incoming leads recorded yet.</p>
            ) : (
              data?.recentLeads?.map((l: any) => (
                <div
                  key={l.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{l.customer?.name}</p>
                    <p className="text-slate-500 text-[11px]">
                      {l.site?.name || "No site selected"} • {l.leadSource?.name || "Direct"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-slate-500">{formatDate(l.createdAt)}</span>
                    <div className="mt-1">
                      <StatusBadge status={l.lifecycleStatus} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              Assigned Operational Work
            </h2>
            <Link href="/tasks" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
              View Tasks &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {data?.tasks?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No pending tasks assigned to you.</p>
            ) : (
              data?.tasks?.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-slate-900 line-clamp-1">{t.title}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Due: {formatDate(t.dueDate)} • Priority: {t.priority}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

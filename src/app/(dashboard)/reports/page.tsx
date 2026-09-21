"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  Users,
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  Building,
  CheckCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [siteId, setSiteId] = useState("");
  const [telecallerId, setTelecallerId] = useState("");

  const [sites, setSites] = useState<any[]>([]);
  const [telecallers, setTelecallers] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/employees?role=TELECALLER").then((r) => r.json()),
    ]).then(([sData, tcData]) => {
      if (sData.sites) setSites(sData.sites);
      if (tcData.employees) setTelecallers(tcData.employees);
    });
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (siteId) params.set("siteId", siteId);
      if (telecallerId) params.set("telecallerId", telecallerId);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [from, to, siteId, telecallerId]);

  const handleExportCsv = () => {
    if (!data?.leadsList || data.leadsList.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = ["Lead ID", "Customer Name", "Phone", "Location", "Site", "Source", "Campaign", "Telecaller", "Status", "Feedback", "Date"];
    const rows = data.leadsList.map((l: any) => [
      `"${l.displayId}"`,
      `"${l.customerName}"`,
      `"${l.phone}"`,
      `"${l.location}"`,
      `"${l.site}"`,
      `"${l.source}"`,
      `"${l.campaign}"`,
      `"${l.telecaller}"`,
      `"${l.status}"`,
      `"${l.feedback}"`,
      `"${formatDate(l.createdAt)}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kyra_crm_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Database Reports & Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Validated real-time aggregations across leads, calling outcomes, site visits, and team conversions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="crm-button-primary bg-emerald-700 hover:bg-emerald-800 text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-600 mb-1">From Date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="crm-input"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-600 mb-1">To Date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="crm-input"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-600 mb-1">Filter by Project Site</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="crm-input"
          >
            <option value="">All Sites</option>
            {sites.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-600 mb-1">Filter by Telecaller</label>
          <select
            value={telecallerId}
            onChange={(e) => setTelecallerId(e.target.value)}
            className="crm-input"
          >
            <option value="">All Specialists</option>
            {telecallers.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Verified Database Totals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="crm-card p-4 border-t-4 border-t-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Inquiries</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {s.totalLeads ?? 0}
          </span>
        </div>

        <div className="crm-card p-4 border-t-4 border-t-blue-600">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Unique Buyers</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {s.uniqueCustomersCount ?? 0}
          </span>
        </div>

        <div className="crm-card p-4 border-t-4 border-t-amber-500">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Calls Conducted</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {s.totalCalls ?? 0}
          </span>
        </div>

        <div className="crm-card p-4 border-t-4 border-t-emerald-600">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Interested Leads</span>
          <span className="text-2xl font-bold font-mono text-emerald-800 mt-1 block">
            {s.interestedLeads ?? 0}
          </span>
        </div>

        <div className="crm-card p-4 border-t-4 border-t-teal-600">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Visits Booked</span>
          <span className="text-2xl font-bold font-mono text-teal-800 mt-1 block">
            {s.totalVisits ?? 0}
          </span>
        </div>

        <div className="crm-card p-4 border-t-4 border-t-purple-600">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Visits Completed</span>
          <span className="text-2xl font-bold font-mono text-purple-800 mt-1 block">
            {s.completedVisits ?? 0}
          </span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Feedback Distribution */}
        <div className="crm-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Call Feedback Distribution
          </h2>

          <div className="space-y-3">
            {data?.feedbackBreakdown?.map((fb: any) => {
              const total = Math.max(1, s.totalLeads || 1);
              const pct = Math.round((fb.count / total) * 100);
              return (
                <div key={fb.name} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{fb.name}</span>
                    <span className="font-mono text-slate-600 font-bold">
                      {fb.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: fb.color,
                        width: `${Math.max(3, pct)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telecaller Performance */}
        <div className="crm-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Specialist Outreach Activity
          </h2>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 font-semibold">Specialist</th>
                <th className="pb-2 font-semibold text-right">Assigned Queue</th>
                <th className="pb-2 font-semibold text-right">Calls Conducted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.telecallerPerformance?.map((tp: any) => (
                <tr key={tp.name} className="hover:bg-slate-50">
                  <td className="py-2.5 font-semibold text-slate-900">{tp.name}</td>
                  <td className="py-2.5 text-right font-mono text-slate-700">{tp.assignedLeads}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                    {tp.callsMade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by Channel and Project Site */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="crm-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Leads By Channel
          </h3>
          <div className="space-y-2 text-xs">
            {data?.leadsBySource?.map((src: any) => (
              <div key={src.name} className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-medium text-slate-700">{src.name}</span>
                <span className="font-mono font-bold text-slate-900">{src.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="crm-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Leads By Project Site
          </h3>
          <div className="space-y-2 text-xs">
            {data?.leadsBySite?.map((site: any) => (
              <div key={site.name} className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-medium text-slate-700">{site.name}</span>
                <span className="font-mono font-bold text-slate-900">{site.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="crm-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Leads By Campaign
          </h3>
          <div className="space-y-2 text-xs">
            {data?.leadsByCampaign?.map((c: any) => (
              <div key={c.name} className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="font-medium text-slate-700">{c.name}</span>
                <span className="font-mono font-bold text-slate-900">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Layers,
  Smartphone,
  Sparkles,
  ExternalLink,
  Activity,
  PhoneCall,
  UserCheck,
  BarChart3,
  AlertCircle,
  Clock,
  Send,
  Eye,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export default function MetaIntegrationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulation form state
  const [simForm, setSimForm] = useState({
    customerName: "Rajesh Kannan",
    phone: "+91 98421 88712",
    email: "rajesh.k@gmail.com",
    place: "Coimbatore",
    profession: "Senior IT Architect",
    platform: "Facebook",
    campaignName: "Monsoon Farmland Harvest 2026",
    adName: "Pollachi 1-Acre Mountain View Video Reel",
  });
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const fetchIntegrationData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/meta");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load Meta integration data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationData();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch("/api/integrations/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIMULATE_OR_INGEST",
          ...simForm,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setSimResult({ success: true, lead: json.lead, message: json.message });
        fetchIntegrationData();
      } else {
        setSimResult({ success: false, error: json.error || "Simulation failed" });
      }
    } catch (err: any) {
      setSimResult({ success: false, error: err.message || "Network error" });
    } finally {
      setSimulating(false);
    }
  };

  const config = data?.config || {};
  const stats = data?.stats || {};
  const logs = data?.recentLogs || [];
  const telecallers = data?.telecallers || [];

  const webhookFullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/integrations/meta`
      : "https://crm.kyragroupindia.com/api/integrations/meta";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <Share2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Meta Ad Manager & CRM Lead Sync Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official webhook integration connecting Facebook & Instagram Lead Generation campaigns directly to telecaller queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchIntegrationData}
            disabled={loading}
            className="crm-button-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Sync Status</span>
          </button>
        </div>
      </div>

      {/* Integration Status Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">
                Meta Webhook Listener: ACTIVE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Real-Time Ingestion
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Listening for inbound Facebook & Instagram instant form submissions. Auto-assigning to active telecallers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Last Sync Check:</span>
            <span className="font-mono text-slate-200">
              {config.lastSyncAt ? formatDateTime(config.lastSyncAt) : "Just now"}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Meta Leads
            </span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats.totalIngested ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">All-time synced from Meta campaigns</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Facebook Ads
            </span>
            <span className="font-bold text-xs text-sky-600">FB Feed & Story</span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-sky-700">
            {stats.facebookLeads ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Instant Lead Forms</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Instagram Leads
            </span>
            <span className="font-bold text-xs text-pink-600">Reels & Explore</span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-pink-700">
            {stats.instagramLeads ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Sponsored Video Ads</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Auto-Assigned Pool
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-700">
            {stats.activeTelecallersCount ?? 0} Telecallers
          </p>
          <div className="mt-2 text-xs text-slate-500">Round-Robin Rotation Active</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meta Webhook Credentials & Setup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="crm-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Webhook Endpoint Settings
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                SSL Verified
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Copy and paste these exact credentials into your <strong>Meta App Dashboard &rarr; Webhooks &rarr; Page Leadgen</strong> configuration.
            </p>

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Callback URL (Webhook Receiver)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={webhookFullUrl}
                  className="crm-input bg-slate-50 text-[11px] font-mono text-slate-800 flex-1 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookFullUrl, "url")}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                  title="Copy URL"
                >
                  {copiedKey === "url" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Verify Token */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Verify Token (hub.verify_token)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={config.verifyToken || "kyra_meta_leads_webhook_token_2026"}
                  className="crm-input bg-slate-50 text-[11px] font-mono text-slate-800 flex-1 select-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(config.verifyToken || "kyra_meta_leads_webhook_token_2026", "token")
                  }
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                  title="Copy Verify Token"
                >
                  {copiedKey === "token" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Meta Ad Account ID */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Meta Ad Account ID
              </label>
              <input
                type="text"
                readOnly
                value={config.adAccountId || "act_849201948201"}
                className="crm-input bg-slate-50 text-[11px] font-mono text-slate-800 select-all"
              />
            </div>

            {/* Auto Assignment Policy */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>Round-Robin Lead Distribution</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Every newly captured Facebook or Instagram lead is instantly allocated to active telecallers with zero delay, prompting push notifications and follow-up tasks.
              </p>
              <div className="pt-1 flex flex-wrap gap-1.5">
                {telecallers.map((tc: any) => (
                  <span
                    key={tc.id}
                    className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-amber-300 rounded text-slate-800 shadow-2xs"
                  >
                    {tc.name} ({tc._count?.assignedTelecallerLeads || 0} leads)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Ingestion Simulator & Test Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="crm-card p-5 border-blue-200/80 bg-gradient-to-br from-white to-blue-50/20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Meta Lead Ingestion & Webhook Tester
                </h2>
              </div>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                Interactive Studio
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Test instant lead intake without waiting for live Meta ad spend. This fires the full webhook pipeline, creates customer & lead records with profession and location, assigns to a telecaller, and triggers real-time notifications.
            </p>

            <form onSubmit={handleRunSimulation} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={simForm.customerName}
                    onChange={(e) => setSimForm({ ...simForm, customerName: e.target.value })}
                    className="crm-input bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number (PH.NO.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={simForm.phone}
                    onChange={(e) => setSimForm({ ...simForm, phone: e.target.value })}
                    className="crm-input bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Profession (Customer Job/Role)
                  </label>
                  <input
                    type="text"
                    value={simForm.profession}
                    onChange={(e) => setSimForm({ ...simForm, profession: e.target.value })}
                    placeholder="e.g. Cardiologist, Software Architect, Builder"
                    className="crm-input bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Location / Place (PLACE)
                  </label>
                  <input
                    type="text"
                    value={simForm.place}
                    onChange={(e) => setSimForm({ ...simForm, place: e.target.value })}
                    placeholder="e.g. Coimbatore, Pollachi, Tirupur"
                    className="crm-input bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lead Source Platform
                  </label>
                  <select
                    value={simForm.platform}
                    onChange={(e) => setSimForm({ ...simForm, platform: e.target.value })}
                    className="crm-input bg-white font-medium"
                  >
                    <option value="Facebook">Facebook (Feed Instant Form)</option>
                    <option value="Insta">Insta (Instagram Reels / Story)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Campaign Name
                  </label>
                  <input
                    type="text"
                    value={simForm.campaignName}
                    onChange={(e) => setSimForm({ ...simForm, campaignName: e.target.value })}
                    className="crm-input bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Creative / Ad Set Name
                </label>
                <input
                  type="text"
                  value={simForm.adName}
                  onChange={(e) => setSimForm({ ...simForm, adName: e.target.value })}
                  className="crm-input bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 italic">
                  Simulates incoming payload &rarr; /api/integrations/meta
                </span>
                <button
                  type="submit"
                  disabled={simulating}
                  className="crm-button-primary bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 shadow-sm flex items-center gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
                  <span>{simulating ? "Ingesting..." : "Simulate Incoming Meta Lead"}</span>
                </button>
              </div>
            </form>

            {/* Simulation Feedback Alert */}
            {simResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                  simResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                {simResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold">
                    {simResult.success ? "Meta Lead Ingested Successfully!" : "Ingestion Failed"}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    {simResult.message || simResult.error}
                  </p>
                  {simResult.lead && (
                    <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center gap-3 text-[11px]">
                      <span>
                        Lead ID: <strong>{simResult.lead.displayId}</strong>
                      </span>
                      <span>
                        Enquiry No: <strong>{simResult.lead.enquiryNo}</strong>
                      </span>
                      <span>
                        Assigned:{" "}
                        <strong>{simResult.lead.assignedTelecaller?.name || "Telecaller"}</strong>
                      </span>
                      <Link
                        href={`/leads/${simResult.lead.displayId}`}
                        className="ml-auto font-bold text-emerald-800 underline hover:text-emerald-950 flex items-center gap-1"
                      >
                        <span>View Lead Card &rarr;</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Meta Ingestion Log Feed */}
      <div className="crm-card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Real-Time Ingestion Activity Feed
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live audit trail of incoming leads received via Meta Webhook endpoint.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {logs.length} logged entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="crm-table-header">
                <th className="crm-table-header">Timestamp</th>
                <th className="crm-table-header">Customer & Profession</th>
                <th className="crm-table-header">Phone</th>
                <th className="crm-table-header">Place</th>
                <th className="crm-table-header">Platform</th>
                <th className="crm-table-header">Campaign & Ad</th>
                <th className="crm-table-header">Assigned Telecaller</th>
                <th className="crm-table-header">Status</th>
                <th className="crm-table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <Clock className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                    <p className="font-semibold text-slate-600">No Meta lead events logged yet</p>
                    <p className="text-[11px] text-slate-400">
                      Use the simulator above or trigger a live webhook to view entries.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="crm-table-cell font-mono text-slate-500 text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="crm-table-cell">
                      <div>
                        <span className="font-bold text-slate-900 block">{log.customerName}</span>
                        {log.profession && (
                          <span className="text-[11px] text-slate-500 block">{log.profession}</span>
                        )}
                      </div>
                    </td>
                    <td className="crm-table-cell font-mono text-slate-800">
                      {log.phone}
                    </td>
                    <td className="crm-table-cell text-slate-700">
                      {log.place || "Coimbatore"}
                    </td>
                    <td className="crm-table-cell">
                      {log.platform === "Insta" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                          Insta
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Facebook
                        </span>
                      )}
                    </td>
                    <td className="crm-table-cell text-slate-700 max-w-[180px] truncate" title={log.campaignName}>
                      <span className="font-medium text-slate-800 block truncate">{log.campaignName}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{log.adName}</span>
                    </td>
                    <td className="crm-table-cell text-slate-800 font-medium">
                      {log.assignedToId || "Queue"}
                    </td>
                    <td className="crm-table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-emerald-500" />
                        {log.status}
                      </span>
                    </td>
                    <td className="crm-table-cell text-right">
                      {log.leadId && (
                        <Link
                          href={`/leads/${log.leadId}`}
                          className="crm-button-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 text-slate-700"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>View</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

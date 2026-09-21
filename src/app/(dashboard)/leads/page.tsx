"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Send,
  Phone,
  PhoneCall,
  Calendar,
  Clock,
  ArrowUpDown,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  MessageCircle,
  Mail,
  Zap,
  CheckCircle2,
  Share2,
  Building,
  UserCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CsvImportModal } from "@/components/CsvImportModal";
import { AssignLeadModal } from "@/components/AssignLeadModal";
import { CallReportModal } from "@/components/CallReportModal";
import {
  formatDate,
  formatDateTime,
  formatWhatsAppUrl,
  formatMailtoUrl,
  formatTelUrl,
  isDateOverdue,
} from "@/lib/utils";

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const initialAction = searchParams.get("action") || "";

  const [leads, setLeads] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters matching reference note
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [feedback, setFeedback] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [telecallerId, setTelecallerId] = useState("");
  const [priority, setPriority] = useState("");

  // Metadata dropdowns
  const [sites, setSites] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [telecallers, setTelecallers] = useState<any[]>([]);

  // Modals & Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(initialAction === "import");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeCallingLead, setActiveCallingLead] = useState<any | null>(null);
  const [autoDistributing, setAutoDistributing] = useState(false);
  const [distributeBannerMsg, setDistributeBannerMsg] = useState<string | null>(null);

  // Fetch current user & metadata
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(console.error);

    Promise.all([
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/lead-sources").then((r) => r.json()),
      fetch("/api/employees?role=TELECALLER").then((r) => r.json()),
    ]).then(([sData, srcData, tcData]) => {
      if (sData.sites) setSites(sData.sites);
      if (srcData.leadSources) setLeadSources(srcData.leadSources);
      if (tcData.employees) setTelecallers(tcData.employees);
    });
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (feedback) params.set("feedback", feedback);
      if (sourceId) params.set("sourceId", sourceId);
      if (siteId) params.set("siteId", siteId);
      if (telecallerId) params.set("telecallerId", telecallerId);
      if (priority) params.set("priority", priority);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, feedback, sourceId, siteId, telecallerId, priority, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1-Click Auto Round-Robin Distribution for unassigned leads
  const handleAutoDistribute = async () => {
    const unassignedLeads = leads.filter((l) => !l.assignedTelecallerId);
    const targetIds = selectedLeadIds.length > 0 ? selectedLeadIds : unassignedLeads.map((l) => l.id);

    if (targetIds.length === 0) {
      alert("No unassigned leads found in this view to distribute.");
      return;
    }

    setAutoDistributing(true);
    try {
      const res = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: targetIds,
          autoRoundRobin: true,
          notes: "Auto-distributed by Admin via Round-Robin engine",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDistributeBannerMsg(data.message || `Successfully distributed ${targetIds.length} leads!`);
        setSelectedLeadIds([]);
        fetchLeads();
        setTimeout(() => setDistributeBannerMsg(null), 5000);
      } else {
        alert(data.error || "Failed to auto-distribute leads.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to auto-distribute.");
    } finally {
      setAutoDistributing(false);
    }
  };

  // Helper for source badge
  const renderSourceBadge = (sourceName?: string | null) => {
    if (!sourceName) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          Direct
        </span>
      );
    }
    const s = sourceName.toLowerCase();
    if (s.includes("whatsapp")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
          WhatsApp
        </span>
      );
    }
    if (s.includes("facebook") || s.includes("fb")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-300">
          Facebook
        </span>
      );
    }
    if (s.includes("insta")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-300">
          Insta
        </span>
      );
    }
    if (s.includes("roadside") || s.includes("hoarding") || s.includes("print")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          Roadside
        </span>
      );
    }
    if (s.includes("walk in") || s.includes("walk-in") || s.includes("expo")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-300">
          Walk in
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        {sourceName}
      </span>
    );
  };

  const isTelecaller = currentUser?.role === "TELECALLER";
  const isAdminOrManager =
    currentUser?.role === "GENERAL_MANAGER" ||
    currentUser?.role === "DIGITAL_HEAD" ||
    currentUser?.role === "CRM_EXECUTIVE";

  const unassignedCount = leads.filter((l) => !l.assignedTelecallerId).length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isTelecaller ? "My Telecalling Outreach Queue" : "Telecalling Admin & Leads Pipeline"}
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
              Calling Sheet Reference
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time lead intake, telephone outreach, callback commitments, and site visit bookings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick round-robin distribution button for Admins */}
          {isAdminOrManager && (
            <button
              onClick={handleAutoDistribute}
              disabled={autoDistributing}
              className="crm-button-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              title="Distribute leads equally across active telecallers"
            >
              <Zap className={`w-3.5 h-3.5 ${autoDistributing ? "animate-spin" : ""}`} />
              <span>
                {selectedLeadIds.length > 0
                  ? `Round-Robin Selected (${selectedLeadIds.length})`
                  : `Auto-Distribute (${unassignedCount} unassigned)`}
              </span>
            </button>
          )}

          {selectedLeadIds.length > 0 && isAdminOrManager && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="crm-button-primary bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-3 flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Assign To ({selectedLeadIds.length})</span>
            </button>
          )}

          <Link
            href="/leads/new"
            className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Lead</span>
          </Link>

          <button
            onClick={() => setShowImportModal(true)}
            className="crm-button-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="CSV Bulk Import"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">CSV Import</span>
          </button>
        </div>
      </div>

      {/* Auto-distribute alert banner */}
      {distributeBannerMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{distributeBannerMsg}</span>
        </div>
      )}

      {/* Filter Toolbar matching reference fields: Cus Name, Place, Site, Source, Feedback */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Search box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search CUS. NAME, Profession, PH.NO, PLACE, S.No..."
              className="crm-input pl-9 text-xs"
            />
          </div>

          {/* Feedback (Exact handwritten options) */}
          <div>
            <select
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="crm-input text-xs font-semibold text-slate-900"
            >
              <option value="">All Feedback Dispositions</option>
              <option value="CONFIRM">Confirm</option>
              <option value="CALL_BACK">Call back</option>
              <option value="NOT_INTERESTED">N.I (Not Interested)</option>
              <option value="NOT_CONNECTED">N.Con (Not Connected)</option>
              <option value="CALL_BUSY">Call busy</option>
              <option value="SWITCHED_OFF">Switched off</option>
              <option value="OTHERS">Others</option>
            </select>
          </div>

          {/* Source of Lead (Whatsapp, Facebook, Insta, Direct, Walk in, Roadside) */}
          <div>
            <select
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="crm-input text-xs"
            >
              <option value="">All Lead Sources</option>
              {leadSources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Site (SITE) */}
          <div>
            <select
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="crm-input text-xs"
            >
              <option value="">All Project Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Telecaller (for Admins) */}
          {!isTelecaller && (
            <div>
              <select
                value={telecallerId}
                onChange={(e) => {
                  setTelecallerId(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="crm-input text-xs"
              >
                <option value="">All Telecallers</option>
                <option value="unassigned">Unassigned Only ({unassignedCount})</option>
                {telecallers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {(search || status || feedback || sourceId || siteId || telecallerId || priority) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Filtered results: <strong>{pagination.total}</strong> matching leads
            </span>
            <button
              onClick={() => {
                setSearch("");
                setStatus("");
                setFeedback("");
                setSourceId("");
                setSiteId("");
                setTelecallerId("");
                setPriority("");
              }}
              className="text-amber-700 hover:text-amber-800 font-medium underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Calling Table (100% faithful to handwritten sheet reference) */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="crm-table-header">
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-slate-600">
                    {selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="crm-table-header">S.No.</th>
                <th className="crm-table-header">CUS. NAME</th>
                <th className="crm-table-header">PH.NO.</th>
                <th className="crm-table-header">PLACE & SOURCE</th>
                <th className="crm-table-header">SITE</th>
                <th className="crm-table-header">Follow up</th>
                <th className="crm-table-header">Feedback</th>
                <th className="crm-table-header">Assigned Specialist</th>
                <th className="crm-table-header text-center">Call Option (Call &bull; WP &bull; Email)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading calling queue...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No matching leads in queue</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Try adjusting filters or import fresh inquiries from Meta Ad Manager.
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const sNoDisplay = lead.enquiryNo || `E${String(idx + 1).padStart(2, "0")}`;
                  const isOverdue = isDateOverdue(lead.nextFollowUpAt);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(lead.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* S.No. (E01, etc.) */}
                      <td className="crm-table-cell">
                        <span className="font-mono font-bold text-slate-950 text-xs block">
                          {sNoDisplay}
                        </span>
                        <Link
                          href={`/leads/${lead.displayId}`}
                          className="font-mono text-[10px] text-slate-500 hover:text-amber-700 hover:underline block"
                          title="View complete lead file"
                        >
                          {lead.displayId}
                        </Link>
                      </td>

                      {/* CUS. NAME + Profession */}
                      <td className="crm-table-cell">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{lead.customer.name}</p>
                          {lead.customer.profession ? (
                            <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {lead.customer.profession}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No profession</span>
                          )}
                        </div>
                      </td>

                      {/* PH.NO. + Time */}
                      <td className="crm-table-cell">
                        <div>
                          <a
                            href={formatTelUrl(lead.customer.phone)}
                            className="font-mono font-bold text-slate-900 hover:text-amber-700 hover:underline block text-xs"
                          >
                            {lead.customer.phone}
                          </a>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{lead.preferredTime || "10:30 AM"}</span>
                          </div>
                        </div>
                      </td>

                      {/* PLACE + Source of lead */}
                      <td className="crm-table-cell">
                        <div>
                          <span className="font-semibold text-slate-800 text-xs block">
                            {lead.customer.location}
                          </span>
                          <div className="mt-1">
                            {renderSourceBadge(lead.leadSource?.name)}
                          </div>
                        </div>
                      </td>

                      {/* SITE */}
                      <td className="crm-table-cell">
                        {lead.site?.name ? (
                          <span className="font-medium text-slate-800 block">
                            {lead.site.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned Site</span>
                        )}
                      </td>

                      {/* Follow up */}
                      <td className="crm-table-cell">
                        {lead.nextFollowUpAt ? (
                          <div>
                            <span
                              className={`inline-block font-mono text-[11px] font-semibold ${
                                isOverdue ? "text-rose-600 font-bold" : "text-amber-800"
                              }`}
                            >
                              {formatDate(lead.nextFollowUpAt, "dd MMM, hh:mm a")}
                            </span>
                            {isOverdue && (
                              <span className="block text-[9px] uppercase font-bold text-rose-700">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Feedback (Confirm, Call back, N.I, N.Con, Call busy, Switched off, Others) */}
                      <td className="crm-table-cell">
                        <StatusBadge status={lead.callFeedback || "NEW"} />
                      </td>

                      {/* Assigned Specialist */}
                      <td className="crm-table-cell">
                        {lead.assignedTelecaller?.name ? (
                          <span className="font-medium text-slate-800 text-xs">
                            {lead.assignedTelecaller.name}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedLeadIds([lead.id]);
                              setShowAssignModal(true);
                            }}
                            className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 text-rose-600" />
                            <span>+ Assign Now</span>
                          </button>
                        )}
                      </td>

                      {/* Call Option Flow: [ Call ] -> [ via ] -> [ Email ] -> [ WP ] */}
                      <td className="crm-table-cell text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200 shadow-2xs">
                          {/* [ Call ] */}
                          <button
                            type="button"
                            onClick={() => setActiveCallingLead(lead)}
                            className="p-1.5 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 transition-colors shadow-2xs"
                            title="Call Customer & Log Outcome"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          {/* [ WP ] */}
                          <a
                            href={formatWhatsAppUrl(
                              lead.customer.phone,
                              lead.customer.name,
                              lead.site?.name
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                            title="Open WhatsApp Chat"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* [ Email ] */}
                          <a
                            href={formatMailtoUrl(
                              lead.customer.email || "",
                              lead.customer.name,
                              lead.site?.name
                            )}
                            className={`p-1.5 rounded-md transition-colors shadow-2xs ${
                              lead.customer.email
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                            title={lead.customer.email ? "Send Email" : "No email available"}
                            onClick={(e) => {
                              if (!lead.customer.email) {
                                e.preventDefault();
                                alert("No email address recorded for this customer.");
                              }
                            }}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>

                          {/* Detail View */}
                          <Link
                            href={`/leads/${lead.displayId}`}
                            className="p-1.5 rounded-md bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors shadow-2xs ml-0.5"
                            title="View Lead Full Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing page <strong>{pagination.page}</strong> of{" "}
              <strong>{pagination.totalPages}</strong> ({pagination.total} total leads)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="crm-button-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="crm-button-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Call Report Modal (Launched via [ Call ] button) */}
      {activeCallingLead && (
        <CallReportModal
          lead={activeCallingLead}
          onClose={() => setActiveCallingLead(null)}
          onSuccess={() => {
            fetchLeads();
            setActiveCallingLead(null);
          }}
        />
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <CsvImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchLeads();
            setShowImportModal(false);
          }}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignLeadModal
          leadIds={selectedLeadIds}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedLeadIds([]);
          }}
          onSuccess={() => {
            fetchLeads();
            setSelectedLeadIds([]);
          }}
        />
      )}
    </div>
  );
}

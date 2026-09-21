"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function SiteVisitsPage() {
  const [siteVisits, setSiteVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Filters
  const [siteId, setSiteId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [sites, setSites] = useState<any[]>([]);
  const [siteManagers, setSiteManagers] = useState<any[]>([]);

  // Update Status Modal State
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [assignedManagerId, setAssignedManagerId] = useState("");
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Calendar navigation
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    Promise.all([
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/employees?role=SITE_MANAGER").then((r) => r.json()),
    ]).then(([sData, smData]) => {
      if (sData.sites) setSites(sData.sites);
      if (smData.employees) setSiteManagers(smData.employees);
    });
  }, []);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (siteId) params.set("siteId", siteId);
      if (status) params.set("status", status);
      if (search) params.set("search", search);

      const res = await fetch(`/api/site-visits?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSiteVisits(data.siteVisits || []);
      }
    } catch (err) {
      console.error("Error fetching site visits:", err);
    } finally {
      setLoading(false);
    }
  }, [siteId, status, search]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const openUpdateModal = (visit: any, initialStatus: string) => {
    setSelectedVisit(visit);
    setTargetStatus(initialStatus);
    setNewDate(visit.scheduledDate ? new Date(visit.scheduledDate).toISOString().split("T")[0] : "");
    setNewTime(visit.scheduledTime || "10:30 AM");
    setRescheduleReason("");
    setCompletionNotes("");
    setCancellationReason("");
    setAssignedManagerId(visit.assignedSiteManagerId || "");
    setModalError(null);
  };

  const handleUpdateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    setUpdating(true);
    setModalError(null);

    try {
      const body: any = { status: targetStatus };

      if (targetStatus === "RESCHEDULED") {
        if (!newDate || !newTime) throw new Error("New inspection date and time are required.");
        body.scheduledDate = newDate;
        body.scheduledTime = newTime;
        body.rescheduleReason = rescheduleReason;
      } else if (targetStatus === "COMPLETED") {
        body.completionNotes = completionNotes || "Site inspection conducted successfully.";
      } else if (targetStatus === "CANCELLED" || targetStatus === "NO_SHOW") {
        if (!cancellationReason) throw new Error("Please specify the cancellation or no-show reason.");
        body.cancellationReason = cancellationReason;
      }

      if (assignedManagerId) {
        body.assignedSiteManagerId = assignedManagerId;
      }

      const res = await fetch(`/api/site-visits/${selectedVisit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update site visit");
      }

      setSelectedVisit(null);
      fetchVisits();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Calendar calculations (days of current month)
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Site Visits & Project Inspections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Field schedules, customer arrivals, status progression, and Site Manager assignments.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-slate-900 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-white text-slate-900 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, or site visit ID..."
            className="crm-input pl-9"
          />
        </div>

        <div>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="crm-input"
          >
            <option value="">All Project Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="crm-input"
          >
            <option value="">All Inspection Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">Customer Did Not Attend</option>
          </select>
        </div>
      </div>

      {/* View: List Mode */}
      {viewMode === "list" && (
        <div className="crm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="crm-table-header">
                  <th className="crm-table-header">Visit ID</th>
                  <th className="crm-table-header">Customer</th>
                  <th className="crm-table-header">Project Site</th>
                  <th className="crm-table-header">Scheduled Date & Time</th>
                  <th className="crm-table-header">Assigned Site Manager</th>
                  <th className="crm-table-header">Status</th>
                  <th className="crm-table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading site visits...
                    </td>
                  </tr>
                ) : siteVisits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">No site visits found</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Schedule a visit when marking a customer lead as Interested.
                      </p>
                    </td>
                  </tr>
                ) : (
                  siteVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="crm-table-cell font-mono font-bold text-slate-900">
                        {v.displayId}
                      </td>
                      <td className="crm-table-cell">
                        <div>
                          <p className="font-bold text-slate-900">{v.customer.name}</p>
                          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                            <a href={`tel:${v.customer.phone}`} className="hover:underline text-amber-700">
                              {v.customer.phone}
                            </a>
                            <span>• {v.customer.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="crm-table-cell font-medium text-slate-800">
                        {v.site.name}
                      </td>
                      <td className="crm-table-cell">
                        <div>
                          <p className="font-semibold text-slate-900">{formatDate(v.scheduledDate)}</p>
                          <p className="font-mono text-[11px] text-slate-500">{v.scheduledTime}</p>
                        </div>
                      </td>
                      <td className="crm-table-cell text-slate-700">
                        {v.assignedSiteManager?.name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="crm-table-cell">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="crm-table-cell text-right space-x-1.5 whitespace-nowrap">
                        {v.status !== "COMPLETED" && v.status !== "CANCELLED" && (
                          <>
                            {v.status !== "CONFIRMED" && (
                              <button
                                onClick={() => openUpdateModal(v, "CONFIRMED")}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 text-[11px] font-medium"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              onClick={() => openUpdateModal(v, "RESCHEDULED")}
                              className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-200 text-[11px] font-medium"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => openUpdateModal(v, "COMPLETED")}
                              className="px-2 py-1 bg-green-700 text-white hover:bg-green-800 rounded text-[11px] font-medium shadow-xs"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => openUpdateModal(v, "CANCELLED")}
                              className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 text-[11px] font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <Link
                          href={`/leads/${v.lead.displayId}`}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 underline text-[11px]"
                        >
                          Lead &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: Calendar Mode */}
      {viewMode === "calendar" && (
        <div className="crm-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h2 className="font-bold text-base text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Current Month
              </button>
              <button
                onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200 text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-slate-100 p-2 text-center font-bold text-slate-600">
                {day}
              </div>
            ))}

            {/* Empty offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[90px] p-2" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = new Date(year, month, dayNum).toISOString().split("T")[0];
              const visitsOnThisDay = siteVisits.filter((v) => {
                const vDate = new Date(v.scheduledDate).toISOString().split("T")[0];
                return vDate === dateStr;
              });

              const isToday =
                new Date().toISOString().split("T")[0] === dateStr;

              return (
                <div
                  key={dayNum}
                  className={`bg-white min-h-[90px] p-2 flex flex-col justify-between ${
                    isToday ? "ring-2 ring-amber-500/50 bg-amber-50/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? "text-amber-700 font-mono font-black" : "text-slate-700"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {visitsOnThisDay.length > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600">
                        {visitsOnThisDay.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
                    {visitsOnThisDay.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => openUpdateModal(v, v.status)}
                        className="p-1 rounded bg-slate-50 hover:bg-amber-100 border border-slate-200 text-[10px] cursor-pointer truncate transition-colors"
                        title={`${v.scheduledTime} - ${v.customer.name} at ${v.site.name}`}
                      >
                        <span className="font-semibold text-slate-800">{v.scheduledTime}</span>{" "}
                        {v.customer.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Update Site Visit Status Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Update Site Visit</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {selectedVisit.displayId} • {selectedVisit.customer?.name} ({selectedVisit.site?.name})
                </p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateVisit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Target Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="crm-input font-semibold"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">Customer Did Not Attend</option>
                </select>
              </div>

              {/* Conditional for Reschedule */}
              {targetStatus === "RESCHEDULED" && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">New Date *</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="crm-input bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">New Time *</label>
                      <select
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="crm-input bg-white"
                      >
                        <option value="09:30 AM">09:30 AM</option>
                        <option value="10:30 AM">10:30 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="02:30 PM">02:30 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Reason for Rescheduling
                    </label>
                    <input
                      type="text"
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="e.g. Client requested Sunday morning due to travel"
                      className="crm-input bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Conditional for Completion */}
              {targetStatus === "COMPLETED" && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <label className="block font-semibold text-emerald-950">
                    Site Visit Completion Notes & Observations
                  </label>
                  <textarea
                    rows={3}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Plots inspected, customer impression, token advance timeline, or legal title copies handed over..."
                    className="crm-input bg-white resize-none"
                  />
                </div>
              )}

              {/* Conditional for Cancellation */}
              {(targetStatus === "CANCELLED" || targetStatus === "NO_SHOW") && (
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                  <label className="block font-semibold text-rose-950">
                    Reason for Cancellation / Non-Attendance *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Specify why the visit was cancelled or what the customer communicated..."
                    className="crm-input bg-white resize-none"
                  />
                </div>
              )}

              {/* Site Manager Assignment */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Assigned Site Manager
                </label>
                <select
                  value={assignedManagerId}
                  onChange={(e) => setAssignedManagerId(e.target.value)}
                  className="crm-input"
                >
                  <option value="">Unassigned</option>
                  {siteManagers.map((sm) => (
                    <option key={sm.id} value={sm.id}>
                      {sm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedVisit(null)}
                  className="crm-button-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
                >
                  {updating ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

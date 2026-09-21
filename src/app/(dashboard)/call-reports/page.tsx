"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PhoneCall, Filter, Search, Calendar, Clock, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function CallReportsPage() {
  const [callReports, setCallReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const url = feedback ? `/api/calls?feedback=${feedback}` : "/api/calls";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCallReports(data.callReports || []);
      }
    } catch (err) {
      console.error("Error loading call reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [feedback]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Telecalling Logs & Call Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit history of every telephone outreach attempt, feedback classification, and client remarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="crm-input text-xs"
          >
            <option value="">All Call Feedbacks</option>
            <option value="INTERESTED">Interested</option>
            <option value="CALL_BACK">Call Back</option>
            <option value="NOT_CONNECTED">Not Connected</option>
            <option value="NOT_INTERESTED">Not Interested</option>
          </select>
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="crm-table-header">
                <th className="crm-table-header">Timestamp</th>
                <th className="crm-table-header">Specialist</th>
                <th className="crm-table-header">Lead & Customer</th>
                <th className="crm-table-header">Outcome</th>
                <th className="crm-table-header">Feedback</th>
                <th className="crm-table-header">Site Visit Status</th>
                <th className="crm-table-header">Notes & Remarks</th>
                <th className="crm-table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading call reports...
                  </td>
                </tr>
              ) : callReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <PhoneCall className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No call logs found</p>
                  </td>
                </tr>
              ) : (
                callReports.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/80">
                    <td className="crm-table-cell font-mono text-slate-500 text-[11px]">
                      {formatDateTime(call.calledAt)}
                    </td>
                    <td className="crm-table-cell font-semibold text-slate-800">
                      {call.telecaller?.name}
                    </td>
                    <td className="crm-table-cell">
                      <div>
                        <p className="font-bold text-slate-900">{call.lead?.customer?.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {call.lead?.displayId} • {call.lead?.customer?.phone}
                        </p>
                      </div>
                    </td>
                    <td className="crm-table-cell font-medium text-slate-700">
                      {call.outcome}
                    </td>
                    <td className="crm-table-cell">
                      <StatusBadge status={call.feedback} />
                    </td>
                    <td className="crm-table-cell">
                      {call.siteVisitFixed === true ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Visit Fixed
                        </span>
                      ) : call.siteVisitFixed === false ? (
                        <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pending Fix
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="crm-table-cell text-slate-600 max-w-xs truncate">
                      {call.notes || call.notInterestedReason || "—"}
                    </td>
                    <td className="crm-table-cell text-right">
                      {call.lead?.displayId && (
                        <Link
                          href={`/leads/${call.lead.displayId}`}
                          className="text-amber-700 hover:text-amber-800 font-medium underline"
                        >
                          View Lead &rarr;
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

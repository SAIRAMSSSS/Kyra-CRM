"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, Filter, Clock, User, Globe } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          System Audit Trail & Security Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Permanent immutable log of system logins, lead assignments, status changes, and administrative actions.
        </p>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="crm-input max-w-xs"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="LEAD_CREATED">LEAD_CREATED</option>
          <option value="LEAD_UPDATED">LEAD_UPDATED</option>
          <option value="LEAD_ASSIGNED">LEAD_ASSIGNED</option>
          <option value="LEAD_IMPORTED">LEAD_IMPORTED</option>
          <option value="CALL_LOGGED">CALL_LOGGED</option>
          <option value="SITE_VISIT_SCHEDULED">SITE_VISIT_SCHEDULED</option>
          <option value="SITE_VISIT_UPDATED">SITE_VISIT_UPDATED</option>
          <option value="TASK_CREATED">TASK_CREATED</option>
          <option value="TASK_UPDATED">TASK_UPDATED</option>
          <option value="EMPLOYEE_CREATED">EMPLOYEE_CREATED</option>
          <option value="EMPLOYEE_UPDATED">EMPLOYEE_UPDATED</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="crm-input max-w-xs"
        >
          <option value="">All Entity Types</option>
          <option value="LEAD">LEAD</option>
          <option value="CALL_REPORT">CALL_REPORT</option>
          <option value="SITE_VISIT">SITE_VISIT</option>
          <option value="TASK">TASK</option>
          <option value="USER">USER</option>
          <option value="CAMPAIGN">CAMPAIGN</option>
        </select>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="crm-table-header">
                <th className="crm-table-header">Timestamp</th>
                <th className="crm-table-header">User & Role</th>
                <th className="crm-table-header">Action</th>
                <th className="crm-table-header">Target Entity</th>
                <th className="crm-table-header">Audit Metadata & Diffs</th>
                <th className="crm-table-header">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-sans">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-sans">
                    <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="crm-table-cell text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="crm-table-cell font-sans">
                      <div>
                        <span className="font-bold text-slate-900">
                          {log.user?.name || "System Bootstrap"}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {log.user?.role || "SYSTEM"}
                        </p>
                      </div>
                    </td>
                    <td className="crm-table-cell">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="crm-table-cell text-slate-700 font-sans">
                      {log.entityType} {log.entityId ? `(#${log.entityId.substring(0, 8)})` : ""}
                    </td>
                    <td className="crm-table-cell text-slate-600 max-w-md truncate">
                      {log.details || "—"}
                    </td>
                    <td className="crm-table-cell text-slate-500">
                      {log.ipAddress || "127.0.0.1"}
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

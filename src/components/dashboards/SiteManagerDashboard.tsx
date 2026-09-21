"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  ArrowRight,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { formatDate } from "@/lib/utils";

export function SiteManagerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error loading Site Manager dashboard:", err))
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
            Site Operations & Field Visits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real estate project inspections, customer arrivals, property tours, and field remarks.
          </p>
        </div>
        <Link
          href="/site-visits"
          className="crm-button-primary flex items-center gap-1.5 text-xs py-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Site Visits Calendar</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today&apos;s Visits
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.todayVisitsCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Scheduled for today</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Schedule
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.upcomingVisitsCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Confirmed forward bookings</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Visits
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.completedVisitsCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Conducted on site</div>
        </div>

        <div className="crm-card p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cancelled / No-show
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {m.cancelledVisitsCount ?? 0}
          </p>
          <div className="mt-2 text-xs text-slate-500">Requires follow-up</div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="crm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Today&apos;s Field Schedule & Client Arrivals
            </h2>
          </div>
          <Link href="/site-visits" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
            Full Schedule &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {data?.todayVisits?.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                No site visits scheduled for today.
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Check upcoming visits below or prepare property collateral for weekend inspections.
              </p>
            </div>
          ) : (
            data?.todayVisits?.map((v: any) => (
              <div
                key={v.id}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 font-semibold rounded text-slate-700">
                      {v.scheduledTime}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{v.customer?.name}</h3>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {v.site?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${v.customer?.phone}`} className="text-amber-700 hover:underline">
                        {v.customer?.phone}
                      </a>
                    </span>
                    <span>Origin: {v.customer?.location}</span>
                  </div>
                  {v.visitRemarks && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100">
                      <strong>Remarks:</strong> {v.visitRemarks}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Link
                    href={`/site-visits?id=${v.id}`}
                    className="crm-button-secondary text-xs py-1.5"
                  >
                    Update Status & Remarks
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Visits & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Visits */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Upcoming Site Inspections
            </h2>
            <Link href="/site-visits" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
              View Calendar &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.upcomingVisits?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No upcoming bookings recorded.</p>
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
                  <StatusBadge status={v.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Operational Tasks */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              Assigned Field Tasks
            </h2>
            <Link href="/tasks" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
              Task Board &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.assignedTasks?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No pending field tasks assigned.</p>
            ) : (
              data?.assignedTasks?.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-slate-900 line-clamp-1">{t.title}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Due: {formatDate(t.dueDate)} • {t.category}
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

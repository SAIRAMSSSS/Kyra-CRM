"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  PhoneCall,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      }
    } catch (err) {
      console.error("Error loading customer 360:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">Customer record not found.</p>
        <Link href="/customers" className="crm-button-secondary mt-3 text-xs">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <Link
          href="/customers"
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers Directory</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-base">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {customer.name}
            </h1>
            <p className="text-xs text-slate-500">
              Customer 360 Consolidated Timeline • {customer.location}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="crm-card p-5 space-y-4 text-xs">
          <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs pb-2 border-b border-slate-100">
            Contact Information
          </h2>

          <div className="space-y-2.5">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Phone Number
              </span>
              <a
                href={`tel:${customer.phone}`}
                className="font-mono font-bold text-sm text-slate-900 hover:text-amber-700 underline"
              >
                {customer.phone}
              </a>
            </div>

            {customer.altPhone && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Alternate Phone
                </span>
                <span className="font-mono text-slate-700">{customer.altPhone}</span>
              </div>
            )}

            {customer.email && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Email
                </span>
                <span className="text-slate-800">{customer.email}</span>
              </div>
            )}

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Location / City
              </span>
              <span className="text-slate-800 font-medium">{customer.location}</span>
            </div>

            {customer.address && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Address
                </span>
                <span className="text-slate-700">{customer.address}</span>
              </div>
            )}

            {customer.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Customer Notes
                </span>
                <p className="text-slate-700 mt-1 bg-slate-50 p-2 rounded">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Associated Leads & Visits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leads */}
          <div className="crm-card p-5 space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Associated Inquiries & Leads ({customer.leads?.length || 0})</span>
            </h2>

            <div className="space-y-3">
              {customer.leads?.map((l: any) => (
                <div
                  key={l.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{l.displayId}</span>
                      <StatusBadge status={l.lifecycleStatus} />
                      <StatusBadge status={l.callFeedback} />
                    </div>
                    <Link
                      href={`/leads/${l.displayId}`}
                      className="text-amber-700 hover:text-amber-800 font-medium underline"
                    >
                      Open Lead &rarr;
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>Project: <strong>{l.site?.name || "Unassigned"}</strong></div>
                    <div>Telecaller: <strong>{l.assignedTelecaller?.name || "Unassigned"}</strong></div>
                    <div>Source: {l.leadSource?.name || "Direct"}</div>
                    <div>Registered: {formatDate(l.createdAt)}</div>
                  </div>

                  {/* Calls on this lead */}
                  {l.callReports?.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Recent Calls ({l.callReports.length}):
                      </span>
                      {l.callReports.slice(0, 2).map((c: any) => (
                        <div key={c.id} className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span>
                            {c.outcome} ({c.feedback}) by {c.telecaller?.name}
                          </span>
                          <span className="text-slate-400 font-mono">{formatDate(c.calledAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Site Visits */}
          <div className="crm-card p-5 space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs pb-2 border-b border-slate-100">
              Site Inspection Appointments ({customer.siteVisits?.length || 0})
            </h2>

            {customer.siteVisits?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No site visits scheduled for this customer yet.</p>
            ) : (
              <div className="space-y-3">
                {customer.siteVisits.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950">{v.displayId}</span>
                        <StatusBadge status={v.status} />
                      </div>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {v.site?.name} • {formatDate(v.scheduledDate)} at {v.scheduledTime}
                      </p>
                      {v.visitRemarks && (
                        <p className="text-slate-600 text-[11px] mt-0.5">{v.visitRemarks}</p>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      Mgr: {v.assignedSiteManager?.name || "Unassigned"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

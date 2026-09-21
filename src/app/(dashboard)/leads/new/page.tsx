"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Building,
  Phone,
  User,
  MapPin,
  Mail,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function NewLeadPage() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [preferredContact, setPreferredContact] = useState("Phone");
  const [siteId, setSiteId] = useState("");
  const [leadSourceId, setLeadSourceId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedTelecallerId, setAssignedTelecallerId] = useState("");
  const [notes, setNotes] = useState("");

  const [sites, setSites] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [telecallers, setTelecallers] = useState<any[]>([]);

  const [phoneWarning, setPhoneWarning] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/lead-sources").then((r) => r.json()),
      fetch("/api/campaigns").then((r) => r.json()),
      fetch("/api/employees?role=TELECALLER").then((r) => r.json()),
    ]).then(([sData, srcData, campData, tcData]) => {
      if (sData.sites) setSites(sData.sites);
      if (srcData.leadSources) setSources(srcData.leadSources);
      if (campData.campaigns) setCampaigns(campData.campaigns);
      if (tcData.employees) setTelecallers(tcData.employees);
    });
  }, []);

  // Instant duplicate phone check on blur/debounce
  const checkDuplicatePhone = async (val: string) => {
    if (val.trim().length >= 8) {
      try {
        const res = await fetch(`/api/leads/check-phone?phone=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setPhoneWarning(data.customer);
            if (!customerName && data.customer.name) {
              setCustomerName(data.customer.name);
            }
            if (!location && data.customer.location) {
              setLocation(data.customer.location);
            }
          } else {
            setPhoneWarning(null);
          }
        }
      } catch (err) {
        console.error("Phone check error:", err);
      }
    } else {
      setPhoneWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          altPhone: altPhone || null,
          email: email || null,
          location,
          address: address || null,
          preferredContact,
          siteId: siteId || null,
          leadSourceId: leadSourceId || null,
          campaignId: campaignId || null,
          priority,
          assignedTelecallerId: assignedTelecallerId || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      router.push(`/leads/${data.lead.displayId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/leads"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leads Pipeline</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Register New Customer Lead
          </h1>
          <p className="text-xs text-slate-500">
            Enter incoming inquiry details with automatic phone validation and telecaller dispatch.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Duplicate Customer Notice */}
      {phoneWarning && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Existing Customer Profile Recognized: {phoneWarning.name} ({phoneWarning.location})
            </p>
            <p className="text-[11px] text-amber-800">
              This customer already has {phoneWarning.leadsCount} prior inquiry record(s) in KYRA CRM. Creating this lead will link it to their consolidated Customer 360 profile without overwriting historical calls.
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="crm-card p-6 sm:p-8 space-y-6">
        {/* Section 1: Customer Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Customer Contact Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Arunachalam Sundaram"
                className="crm-input"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  checkDuplicatePhone(e.target.value);
                }}
                onBlur={() => checkDuplicatePhone(phone)}
                placeholder="e.g. +91 98401 23456"
                className="crm-input font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alternate Phone Number
              </label>
              <input
                type="tel"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="e.g. +91 94440 98765"
                className="crm-input font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="crm-input"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Location / City *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Coimbatore, Tamil Nadu"
                className="crm-input"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Preferred Contact Channel
              </label>
              <select
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
                className="crm-input"
              >
                <option value="Phone">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Residential / Business Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Door No, Street Name, Landmark..."
                className="crm-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Business & Assignment Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Project Interest & Work Assignment
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Selected Project Site
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="crm-input"
              >
                <option value="">Select Project Site (if decided)...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lead Acquisition Source
              </label>
              <select
                value={leadSourceId}
                onChange={(e) => setLeadSourceId(e.target.value)}
                className="crm-input"
              >
                <option value="">Select Lead Source...</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Marketing Campaign Attribution
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="crm-input"
              >
                <option value="">None / Organic Referral</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.platform})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lead Priority Rating
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="crm-input"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Hot Prospect)</option>
                <option value="URGENT">Urgent (Immediate Callback)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Assign Telecaller Specialist
              </label>
              <select
                value={assignedTelecallerId}
                onChange={(e) => setAssignedTelecallerId(e.target.value)}
                className="crm-input"
              >
                <option value="">Unassigned (Queue in CRM Intake)</option>
                {telecallers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.profile?.department || "Telecaller"})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Requirement Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key details on budget, acreage interest, investment vs farmhouse purpose..."
                className="crm-input resize-none"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link href="/leads" className="crm-button-secondary py-2">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="crm-button-primary py-2 px-6 bg-slate-900 hover:bg-slate-800"
          >
            {loading ? "Registering Lead..." : "Save & Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

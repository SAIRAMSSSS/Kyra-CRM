"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, PlusCircle, MapPin, Users, Calendar, X, AlertCircle } from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Site Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(data.sites || []);
      }
    } catch (err) {
      console.error("Error loading sites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, address, description }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project site");
      }

      setShowModal(false);
      setName("");
      setLocation("");
      setAddress("");
      setDescription("");
      fetchSites();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            KYRA Real Estate Project Sites
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Farmland communities, resort plots, residential layouts, and site manager operational hubs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="crm-button-primary flex items-center gap-1.5 text-xs py-2 px-4 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Project Site</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading sites...
          </div>
        ) : sites.length === 0 ? (
          <div className="col-span-full p-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No project sites defined</p>
          </div>
        ) : (
          sites.map((site) => (
            <div
              key={site.id}
              className="crm-card p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active Development
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {site.id.substring(0, 8)}...
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{site.name}</h3>

                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{site.location}</span>
                </p>

                {site.address && (
                  <p className="text-[11px] text-slate-500">{site.address}</p>
                )}

                {site.description && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                    {site.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{site._count?.leads || 0}</strong> leads
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{site._count?.siteVisits || 0}</strong> visits
                  </span>
                </div>

                <Link
                  href={`/leads?siteId=${site.id}`}
                  className="text-amber-700 hover:text-amber-800 font-medium underline"
                >
                  View Inquiries &rarr;
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Site Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Add New Project Site</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSite} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site / Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nilgiri View County"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Region / Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pollachi, Tamil Nadu"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Near Anaimalai Hills Road..."
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Property specifications, approvals (DTCP/RERA), amenities..."
                  className="crm-input resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="crm-button-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
                >
                  {createLoading ? "Saving..." : "Create Project Site"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

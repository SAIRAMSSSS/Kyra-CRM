"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  PlusCircle,
  Tag,
  Building,
  Shield,
  Database,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Source Modal
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceDesc, setSourceDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lead-sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data.leadSources || []);
      }
    } catch (err) {
      console.error("Error loading lead sources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/lead-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sourceName, description: sourceDesc }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead source");
      }

      setShowSourceModal(false);
      setSourceName("");
      setSourceDesc("");
      fetchSources();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          System Settings & Lead Channels
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure lead intake origins, marketing attribution channels, and corporate configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Lead Sources */}
        <div className="md:col-span-2 space-y-4">
          <div className="crm-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Lead Acquisition Sources
                </h2>
                <p className="text-xs text-slate-500">Channels used to attribute incoming prospect inquiries</p>
              </div>
              <button
                onClick={() => setShowSourceModal(true)}
                className="crm-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Source</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading lead sources...
                </div>
              ) : sources.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No lead sources configured.
                </div>
              ) : (
                sources.map((src) => (
                  <div
                    key={src.id}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{src.name}</p>
                      {src.description && (
                        <p className="text-slate-500 text-[11px] mt-0.5">{src.description}</p>
                      )}
                    </div>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-800">
                      {src._count?.leads || 0} leads
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Security & Architecture Info */}
        <div className="space-y-4">
          <div className="crm-card p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Portal Architecture
              </h3>
            </div>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Application:</span>
                <strong className="text-slate-900 font-mono">KYRA CRM v1.0</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Database Engine:</span>
                <strong className="text-slate-900 font-mono">Prisma / SQLite</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Auth Session:</span>
                <strong className="text-slate-900 font-mono">JWT / HttpOnly Cookie</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Auditing:</span>
                <strong className="text-emerald-700 font-mono">Active (All Mutations)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Server Time:</span>
                <strong className="text-slate-900 font-mono">{new Date().toISOString().split("T")[0]}</strong>
              </div>
            </div>
          </div>

          <div className="crm-card p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs pb-2 border-b border-slate-100">
              Fast Administrative Links
            </h3>
            <div className="space-y-2">
              <Link
                href="/sites"
                className="block p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-800 font-medium transition-colors"
              >
                &rarr; Project Sites Directory
              </Link>
              <Link
                href="/employees"
                className="block p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-800 font-medium transition-colors"
              >
                &rarr; Employee Accounts & Access
              </Link>
              <Link
                href="/audit-logs"
                className="block p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-800 font-medium transition-colors"
              >
                &rarr; System Audit Log Trail
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lead Source Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Add Lead Acquisition Source</h3>
              </div>
              <button
                onClick={() => setShowSourceModal(false)}
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

            <form onSubmit={handleCreateSource} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. YouTube Walkthrough Campaign"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={sourceDesc}
                  onChange={(e) => setSourceDesc(e.target.value)}
                  placeholder="Target channel or partner attribution..."
                  className="crm-input"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSourceModal(false)}
                  className="crm-button-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
                >
                  {createLoading ? "Saving..." : "Save Source"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

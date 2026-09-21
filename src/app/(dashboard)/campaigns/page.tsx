"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  PlusCircle,
  Calendar,
  Users,
  Film,
  Image as ImageIcon,
  Share2,
  Globe,
  Tag,
  X,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Campaign Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("Video");
  const [platform, setPlatform] = useState("Meta");
  const [leadSourceId, setLeadSourceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [mediaAttachmentUrl, setMediaAttachmentUrl] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Error loading campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetch("/api/lead-sources")
      .then((r) => r.json())
      .then((data) => {
        if (data.leadSources) {
          setSources(data.leadSources);
          if (data.leadSources.length > 0) {
            setLeadSourceId(data.leadSources[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          contentTitle,
          contentType,
          platform,
          leadSourceId: leadSourceId || null,
          startDate: startDate || null,
          endDate: endDate || null,
          status,
          notes,
          mediaAttachmentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      setShowModal(false);
      setName("");
      setDescription("");
      setContentTitle("");
      fetchCampaigns();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "Video":
        return <Film className="w-4 h-4 text-rose-500" />;
      case "Image":
      case "Poster":
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <Share2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Promotional Content & Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Design, schedule, and measure lead generation attribution across marketing initiatives.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="crm-button-primary flex items-center gap-1.5 text-xs py-2 px-4 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Promotional Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full p-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No promotional campaigns created yet</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Launch your first campaign to attribute incoming leads.
            </p>
          </div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              className="crm-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                    {c.platform}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    {getContentIcon(c.contentType)}
                    <span>{c.contentType} • &quot;{c.contentTitle}&quot;</span>
                  </div>
                </div>

                {c.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {c.startDate ? formatDate(c.startDate) : "Ongoing"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {c.leadSource?.name || "Direct"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-slate-700">Leads Attributed:</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {c._count?.leads || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Created by: {c.createdBy?.name}</span>
                  <Link
                    href={`/leads?campaignId=${c.id}`}
                    className="text-amber-700 hover:text-amber-800 font-medium underline"
                  >
                    View Leads &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Create Promotional Campaign</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monsoon Agrofarms High-Yield Drive 2026"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Promotional Content Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="e.g. Own 1-Acre Gated Farmland in Pollachi with Mountain Views"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="crm-input"
                  >
                    <option value="Video">Video Walkthrough</option>
                    <option value="Image">Photo Carousel</option>
                    <option value="Poster">Poster / Print Banner</option>
                    <option value="Social media post">Social Media Post</option>
                    <option value="Advertisement">Paid Advertisement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Platform / Channel
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="crm-input"
                  >
                    <option value="Meta">Meta (Facebook / Instagram)</option>
                    <option value="Google Ads">Google Ads (Search & Display)</option>
                    <option value="Print">Print Media / Hoardings</option>
                    <option value="Direct">Direct Outreach / Email</option>
                    <option value="Property Expo">Property Expo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Associated Lead Source
                  </label>
                  <select
                    value={leadSourceId}
                    onChange={(e) => setLeadSourceId(e.target.value)}
                    className="crm-input"
                  >
                    {sources.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campaign Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="crm-input font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Campaign Description & Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target demographic, ad angles, offer details..."
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
                  disabled={modalLoading}
                  className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
                >
                  {modalLoading ? "Saving..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

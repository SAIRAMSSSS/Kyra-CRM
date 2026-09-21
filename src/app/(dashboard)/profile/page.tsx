"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, KeyRound, Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setSuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Employee Profile & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Account credentials, corporate role privileges, and security settings.
        </p>
      </div>

      {/* Profile Card */}
      <div className="crm-card p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-bold text-xl flex items-center justify-center ring-2 ring-slate-200">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {user?.role?.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.employeeCode || "KYRA Staff"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">
              Department
            </span>
            <span className="font-semibold text-slate-800">{user?.department || "Operations"}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">
              Designation
            </span>
            <span className="font-semibold text-slate-800">{user?.designation || "Specialist"}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">
              Account Status
            </span>
            <span className="font-semibold text-emerald-700">{user?.status || "ACTIVE"}</span>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="crm-card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <KeyRound className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Change Account Password</h3>
            <p className="text-xs text-slate-500">
              Ensure your password is at least 8 characters long for corporate compliance.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="crm-input font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Password *
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="crm-input font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="crm-input font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
          >
            {submitting ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

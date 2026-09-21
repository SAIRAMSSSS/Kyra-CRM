"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  CalendarCheck,
  Building2,
  UserCheck,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("gm@kyra.com");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRoleKey, setActiveRoleKey] = useState("GM");

  const demoAccounts = [
    {
      key: "GM",
      role: "General Manager",
      name: "Rajesh Menon",
      email: "gm@kyra.com",
      desc: "Full organization oversight, conversion funnels, audit trail, and employee administration",
      icon: TrendingUp,
      color: "from-blue-600 to-indigo-700",
    },
    {
      key: "DH",
      role: "Digital Head",
      name: "Anita Sharma",
      email: "digital@kyra.com",
      desc: "Promotional campaigns, marketing sources, lead generation, and team work delegation",
      icon: Layers,
      color: "from-purple-600 to-pink-700",
    },
    {
      key: "CRM",
      role: "CRM Executive",
      name: "Karthik Verma",
      email: "crm@kyra.com",
      desc: "Lead intake, CSV import, telecaller workload assignment, callbacks, and duplicate checks",
      icon: UserCheck,
      color: "from-amber-500 to-amber-700",
    },
    {
      key: "SM",
      role: "Site Manager",
      name: "Suresh Pillai",
      email: "site@kyra.com",
      desc: "Field operations, site visits calendar, client arrivals, inspection progress & remarks",
      icon: CalendarCheck,
      color: "from-emerald-600 to-teal-700",
    },
    {
      key: "TC",
      role: "Telecaller",
      name: "Priya Nair",
      email: "telecaller1@kyra.com",
      desc: "Assigned lead queue, click-to-call dialer, controlled feedback & site visit booking",
      icon: PhoneCall,
      color: "from-cyan-600 to-blue-700",
    },
  ];

  const handleSelectRole = (item: (typeof demoAccounts)[0]) => {
    setActiveRoleKey(item.key);
    setEmail(item.email);
    setPassword("Password123!");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check credentials.");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected authentication error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentRole = demoAccounts.find((a) => a.key === activeRoleKey) || demoAccounts[0];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b1329] text-slate-100 font-sans">
      {/* Left Column: Zoho CRM-style Enterprise Presentation */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-[#070d1e] via-[#0c1833] to-[#081228] border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-white">KYRA</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
                Employee Operations Portal
              </p>
            </div>
          </div>
        </div>

        {/* Value Proposition Highlights */}
        <div className="relative z-10 py-10 lg:py-16 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-amber-400 border border-slate-700/80 mb-3 shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              KYRA Group India • Private Enterprise Portal
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Connected Operations for Farm Communities & Land Development
            </h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-lg">
              Unified workspace engineered for promotional campaign tracking, click-to-call telecalling, lead assignment, and real-time site inspection workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200 text-xs">Direct Click-to-Call</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Instant dialer action with controlled feedback logging
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200 text-xs">Site Visits Calendar</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Fixed inspection scheduling and field updates
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200 text-xs">Duplicate Phone Guard</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Customer 360 recognition on incoming inquiries
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200 text-xs">Role-Based Security</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  Strict authorization across GM, CRM, and Telecallers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Pollachi • Coimbatore • Erode • Wayanad</span>
          <span className="font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% Legal Title Clarity
          </span>
        </div>
      </div>

      {/* Right Column: Zoho-Style Sign In Box */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#090f1f]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Employee Sign In
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your role profile below for instant preview or enter credentials.
            </p>
          </div>

          {/* Zoho-Style Role Quick-Fill Pills */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Quick-Select Role Profile:
            </span>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-medium">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.key}
                  type="button"
                  onClick={() => handleSelectRole(acc)}
                  className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
                    activeRoleKey === acc.key
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md ring-1 ring-amber-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                  title={`${acc.role} (${acc.name})`}
                >
                  <span className="text-xs font-mono font-bold leading-tight">{acc.key}</span>
                  <span className="text-[9px] truncate max-w-[55px] opacity-80 mt-0.5">
                    {acc.role.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Role Summary Preview */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">{currentRole.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    {currentRole.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {currentRole.desc}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Corporate Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@kyra.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-500">Seed: Password123!</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Remember session on this device</span>
                </label>
                <span className="text-amber-400 font-semibold cursor-default">
                  Internal Staff Portal
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
              >
                {loading ? (
                  <span>Authenticating Employee Session...</span>
                ) : (
                  <>
                    <span>Enter KYRA Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Secured with 256-bit encryption • Live Database Authenticated</span>
            </p>
            <p>Authorized KYRA personnel only. Unapproved access attempts are logged.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

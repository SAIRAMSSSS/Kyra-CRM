"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CalendarCheck,
  CheckSquare,
  Megaphone,
  UserCheck,
  BarChart3,
  ShieldAlert,
  Settings,
  Clock,
  Building2,
  Contact,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  PhoneForwarded,
  Sparkles,
  ChevronDown,
  UserPlus,
  CalendarPlus,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { AuthUser, UserRole } from "@/lib/rbac";

interface SidebarProps {
  user: AuthUser;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenQuickDialer?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  category: "MAIN" | "SALES" | "CALLING" | "OPS" | "ADMIN";
  badge?: string;
}

export function Sidebar({
  user,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onOpenQuickDialer,
}: SidebarProps) {
  const pathname = usePathname();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE", "SITE_MANAGER", "TELECALLER"],
      category: "MAIN",
    },
    {
      label: user.role === "TELECALLER" ? "My Leads Queue" : "Leads Pipeline",
      href: "/leads",
      icon: Users,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE", "SITE_MANAGER", "TELECALLER"],
      category: "SALES",
    },
    {
      label: "Customers 360",
      href: "/customers",
      icon: Contact,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE", "SITE_MANAGER"],
      category: "SALES",
    },
    {
      label: "Campaigns",
      href: "/campaigns",
      icon: Megaphone,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD"],
      category: "SALES",
    },
    {
      label: "Meta Ad Manager",
      href: "/integrations/meta",
      icon: Share2,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE"],
      category: "SALES",
      badge: "SYNC",
    },
    {
      label: user.role === "TELECALLER" ? "My Calls" : "Call Outreach Logs",
      href: "/call-reports",
      icon: PhoneCall,
      roles: ["GENERAL_MANAGER", "CRM_EXECUTIVE", "TELECALLER"],
      category: "CALLING",
    },
    {
      label: "Follow-up Queue",
      href: "/follow-ups",
      icon: Clock,
      roles: ["GENERAL_MANAGER", "CRM_EXECUTIVE", "TELECALLER"],
      category: "CALLING",
    },
    {
      label: "Site Visits",
      href: "/site-visits",
      icon: CalendarCheck,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE", "SITE_MANAGER", "TELECALLER"],
      category: "CALLING",
    },
    {
      label: "Tasks & Work",
      href: "/tasks",
      icon: CheckSquare,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE", "SITE_MANAGER", "TELECALLER"],
      category: "OPS",
    },
    {
      label: "Project Sites",
      href: "/sites",
      icon: Building2,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE", "SITE_MANAGER"],
      category: "OPS",
    },
    {
      label: "Reports & Analytics",
      href: "/reports",
      icon: BarChart3,
      roles: ["GENERAL_MANAGER", "DIGITAL_HEAD", "CRM_EXECUTIVE"],
      category: "ADMIN",
    },
    {
      label: "Employee Accounts",
      href: "/employees",
      icon: UserCheck,
      roles: ["GENERAL_MANAGER"],
      category: "ADMIN",
    },
    {
      label: "Audit Logs",
      href: "/audit-logs",
      icon: ShieldAlert,
      roles: ["GENERAL_MANAGER"],
      category: "ADMIN",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["GENERAL_MANAGER", "CRM_EXECUTIVE"],
      category: "ADMIN",
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const categories = [
    { key: "MAIN", title: "MAIN" },
    { key: "SALES", title: "SALES & LEADS" },
    { key: "CALLING", title: "TELECALLING & VISITS" },
    { key: "OPS", title: "OPERATIONS" },
    { key: "ADMIN", title: "ADMINISTRATION" },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#0d1527] text-slate-300 border-r border-slate-800/90 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#090f1d]">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
            K
          </div>
          {!isCollapsed && (
            <div className="truncate animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">KYRA</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  CRM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Operations
              </p>
            </div>
          )}
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Zoho CRM Signature "+ Quick Create" Button */}
      <div className="p-3 border-b border-slate-800/70 relative">
        {!isCollapsed ? (
          <div className="relative">
            <button
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-between shadow-md transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-slate-950/20 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                </div>
                <span>Quick Create</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
            </button>

            {createMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCreateMenuOpen(false)}
                />
                <div className="absolute left-0 right-0 top-12 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/leads/new"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <span>New Lead Inquiry</span>
                  </Link>

                  {onOpenQuickDialer && (
                    <button
                      onClick={() => {
                        setCreateMenuOpen(false);
                        onOpenQuickDialer();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors text-left"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <span>Telecaller Dialer</span>
                    </button>
                  )}

                  <Link
                    href="/site-visits"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4 text-amber-400" />
                    <span>Schedule Site Visit</span>
                  </Link>

                  <Link
                    href="/tasks"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    <span>Assign Team Task</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Collapsed Quick Create Icon */
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (onOpenQuickDialer) onOpenQuickDialer();
              }}
              className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all group relative"
              title="Quick Dialer / Actions"
            >
              <Plus className="w-5 h-5" />
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700">
                Quick Actions
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Telecalling Access Card (for Telecaller & CRM roles) */}
      {!isCollapsed && onOpenQuickDialer && (
        <div className="px-3 pt-2.5 pb-1">
          <button
            onClick={onOpenQuickDialer}
            className="w-full p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <span>Click-to-Call Dialer</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              DIAL
            </span>
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {categories.map((cat) => {
          const itemsInCat = filteredNavItems.filter((i) => i.category === cat.key);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {cat.title}
                </p>
              )}

              {itemsInCat.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`relative group flex items-center ${
                      isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                    } rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-amber-400/15 text-white border border-amber-400/30 shadow-sm"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                  >
                    {/* Zoho Active Glow Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-400 rounded-r-full shadow-sm" />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-800 text-slate-300">
                        {item.badge}
                      </span>
                    )}

                    {/* Popover Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Card & Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/90 bg-[#090f1d] text-xs">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs ring-1 ring-slate-700">
                  {user.name.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090f1d]" />
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-200 text-xs truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-amber-400/90 font-mono truncate leading-none mt-0.5">
                  {user.role.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs ring-1 ring-slate-700">
                {user.name.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#090f1d]" />
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 z-20 transition-all duration-200 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

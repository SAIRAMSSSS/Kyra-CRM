"use client";

import React, { useState, useEffect } from "react";
import { AuthUser } from "@/lib/rbac";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { QuickDialerModal } from "./QuickDialerModal";

interface AppShellProps {
  user: AuthUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [quickDialerOpen, setQuickDialerOpen] = useState(false);

  // Restore sidebar collapse state preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kyra_sidebar_collapsed");
      if (saved === "true") setIsCollapsed(true);
    } catch {}
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kyra_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Sidebar
        user={user}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onOpenQuickDialer={() => setQuickDialerOpen(true)}
      />

      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-200 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <Header
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenQuickDialer={() => setQuickDialerOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Telecaller Quick Dialer */}
      {quickDialerOpen && (
        <QuickDialerModal onClose={() => setQuickDialerOpen(false)} />
      )}
    </div>
  );
}

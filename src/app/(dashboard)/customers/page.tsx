"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Contact, Search, Phone, MapPin, Building, ArrowRight, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : "/api/customers";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer 360 Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Consolidated customer profiles across inquiries, selected plots, telecalling logs, and field visits.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or city..."
            className="crm-input pl-9 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading customer profiles...
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full p-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <Contact className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No customer records found</p>
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              className="crm-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm ring-1 ring-slate-200">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {c.location}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Phone:</span>
                    <a href={`tel:${c.phone}`} className="font-mono font-semibold text-slate-900 hover:text-amber-700">
                      {c.phone}
                    </a>
                  </div>
                  {c.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Email:</span>
                      <span className="truncate max-w-[170px]">{c.email}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-100/70 border border-slate-200/60 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Leads</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{c.leads?.length || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-100/70 border border-slate-200/60 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Site Visits</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{c.siteVisits?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  Since {formatDate(c.createdAt)}
                </span>
                <Link
                  href={`/customers/${c.id}`}
                  className="crm-button-secondary text-xs py-1 px-3 flex items-center gap-1"
                >
                  <span>360 History</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

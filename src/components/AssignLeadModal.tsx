"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, X, AlertCircle, Send, Check } from "lucide-react";

interface AssignLeadModalProps {
  leadIds: string[];
  currentAssigneeName?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignLeadModal({
  leadIds,
  currentAssigneeName,
  onClose,
  onSuccess,
}: AssignLeadModalProps) {
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [selectedTelecallerId, setSelectedTelecallerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/employees?role=TELECALLER")
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) {
          setTelecallers(data.employees);
          if (data.employees.length > 0) {
            setSelectedTelecallerId(data.employees[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds,
          telecallerId: selectedTelecallerId || null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign leads");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">
              {leadIds.length === 1 ? "Assign Lead" : `Bulk Assign ${leadIds.length} Leads`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentAssigneeName && (
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-xs text-slate-600">
            Currently Assigned To: <strong className="text-slate-900">{currentAssigneeName}</strong>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAssign} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Telecaller Specialist
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {telecallers.map((tc) => {
                const isSelected = selectedTelecallerId === tc.id;
                const activeCount = tc._count?.assignedTelecallerLeads || 0;
                return (
                  <div
                    key={tc.id}
                    onClick={() => setSelectedTelecallerId(tc.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-amber-50/80 border-amber-500 shadow-sm ring-1 ring-amber-500"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">{tc.name}</p>
                      <p className="text-[11px] text-slate-500">{tc.profile?.designation || tc.email}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Workload</span>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {activeCount} leads
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Assignment Note (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Priority customer looking for immediate weekend site inspection."
              className="crm-input resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="crm-button-secondary py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedTelecallerId}
              className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Assigning..." : "Confirm Assignment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Upload,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Table,
  ArrowRight,
  Download,
} from "lucide-react";

interface CsvImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({ onClose, onSuccess }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Default batch metadata
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [telecallers, setTelecallers] = useState<{ id: string; name: string }[]>([]);

  const [defaultSiteId, setDefaultSiteId] = useState("");
  const [defaultSourceId, setDefaultSourceId] = useState("");
  const [defaultTelecallerId, setDefaultTelecallerId] = useState("");

  // Column mapping
  const [mapping, setMapping] = useState({
    name: "",
    phone: "",
    location: "",
    email: "",
    notes: "",
    priority: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/sites").then((r) => r.json()),
      fetch("/api/lead-sources").then((r) => r.json()),
      fetch("/api/employees?role=TELECALLER").then((r) => r.json()),
    ]).then(([sData, srcData, tcData]) => {
      if (sData.sites) setSites(sData.sites);
      if (srcData.leadSources) setSources(srcData.leadSources);
      if (tcData.employees) setTelecallers(tcData.employees);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError("Failed to parse CSV: " + results.errors[0].message);
          return;
        }

        const fields = results.meta.fields || [];
        setHeaders(fields);
        setParsedRows(results.data);

        // Auto-guess column mapping
        const autoMap: any = {};
        fields.forEach((f) => {
          const lower = f.toLowerCase().trim();
          if (lower.includes("name") || lower.includes("customer")) autoMap.name = f;
          else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("contact")) autoMap.phone = f;
          else if (lower.includes("location") || lower.includes("city") || lower.includes("place")) autoMap.location = f;
          else if (lower.includes("email")) autoMap.email = f;
          else if (lower.includes("note") || lower.includes("remark")) autoMap.notes = f;
          else if (lower.includes("priority")) autoMap.priority = f;
        });
        setMapping((prev) => ({ ...prev, ...autoMap }));
        setStep("preview");
      },
      error: (err) => {
        setError(err.message);
      },
    });
  };

  const handleDownloadSample = () => {
    const sampleCsv = `Customer Name,Phone,Location,Email,Notes,Priority\n"Kavitha Sundar","+91 98401 22334","Coimbatore","kavitha@example.com","Looking for 1 acre farmland","HIGH"\n"Mahesh N","+91 97890 55443","Tirupur","mahesh.n@gmail.com","Interested in residential plots","MEDIUM"`;
    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "kyra_lead_import_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (!mapping.name || !mapping.phone || !mapping.location) {
      setError("Please map the required fields: Customer Name, Phone, and Location.");
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare normalized rows
    const normalizedRows = parsedRows.map((r) => ({
      name: r[mapping.name],
      phone: r[mapping.phone],
      location: r[mapping.location],
      email: mapping.email ? r[mapping.email] : undefined,
      notes: mapping.notes ? r[mapping.notes] : undefined,
      priority: mapping.priority ? r[mapping.priority] : "MEDIUM",
    }));

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: normalizedRows,
          defaultSiteId: defaultSiteId || null,
          defaultSourceId: defaultSourceId || null,
          defaultTelecallerId: defaultTelecallerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult(data.results);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Failed to process import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Bulk Lead Intake & CSV Import</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="p-8 text-center space-y-5">
            <div className="max-w-md mx-auto border-2 border-dashed border-slate-300 rounded-2xl p-8 hover:border-amber-500 transition-colors bg-slate-50/50">
              <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Choose a CSV file to import
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                File must include Name, Phone Number, and Location.
              </p>
              <label className="crm-button-primary cursor-pointer text-xs py-2 px-4">
                <span>Select CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-xs text-amber-700 hover:text-amber-800 font-medium inline-flex items-center gap-1.5 underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Mapping */}
        {step === "preview" && (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-bold text-slate-800 text-sm">
                  Found {parsedRows.length} Rows in {file?.name}
                </span>
                <p className="text-slate-500 text-[11px]">
                  Map CSV headers to CRM fields and specify default project assignments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="text-slate-500 hover:text-slate-800 underline text-xs"
              >
                Change File
              </button>
            </div>

            {/* Column Mapping Selectors */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Field Mapping
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <select
                    value={mapping.name}
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="crm-input bg-white"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <select
                    value={mapping.phone}
                    onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                    className="crm-input bg-white"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Location / City *
                  </label>
                  <select
                    value={mapping.location}
                    onChange={(e) => setMapping({ ...mapping, location: e.target.value })}
                    className="crm-input bg-white"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <select
                    value={mapping.email}
                    onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                    className="crm-input bg-white"
                  >
                    <option value="">None / Ignore</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Notes</label>
                  <select
                    value={mapping.notes}
                    onChange={(e) => setMapping({ ...mapping, notes: e.target.value })}
                    className="crm-input bg-white"
                  >
                    <option value="">None / Ignore</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={mapping.priority}
                    onChange={(e) => setMapping({ ...mapping, priority: e.target.value })}
                    className="crm-input bg-white"
                  >
                    <option value="">Default (MEDIUM)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Batch defaults */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
              <h3 className="font-bold text-amber-950 uppercase tracking-wider text-[11px]">
                Batch Assignment Defaults
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Site</label>
                  <select
                    value={defaultSiteId}
                    onChange={(e) => setDefaultSiteId(e.target.value)}
                    className="crm-input bg-white"
                  >
                    <option value="">Select Site (Optional)...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={defaultSourceId}
                    onChange={(e) => setDefaultSourceId(e.target.value)}
                    className="crm-input bg-white"
                  >
                    <option value="">Select Source (Optional)...</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Telecaller</label>
                  <select
                    value={defaultTelecallerId}
                    onChange={(e) => setDefaultTelecallerId(e.target.value)}
                    className="crm-input bg-white"
                  >
                    <option value="">Keep Unassigned</option>
                    {telecallers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview Sample Rows */}
            <div>
              <h3 className="font-bold text-slate-800 mb-2">First 3 Rows Sample:</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="p-2 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 3).map((row, idx) => (
                      <tr key={idx}>
                        {headers.map((h) => (
                          <td key={h} className="p-2 text-slate-800">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="crm-button-secondary py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteImport}
                className="crm-button-primary py-2 px-5 bg-slate-900 hover:bg-slate-800"
              >
                {loading ? "Importing Data..." : `Import ${parsedRows.length} Leads`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result Summary */}
        {step === "result" && (
          <div className="p-8 space-y-5 text-center text-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              CSV Lead Import Completed
            </h3>

            <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                  Total Processed
                </span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {importResult?.totalRows ?? 0}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 text-[10px] block uppercase font-semibold">
                  Successfully Added
                </span>
                <span className="text-xl font-bold font-mono text-emerald-800">
                  {importResult?.imported ?? 0}
                </span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-rose-700 text-[10px] block uppercase font-semibold">
                  Failed Rows
                </span>
                <span className="text-xl font-bold font-mono text-rose-800">
                  {importResult?.failed ?? 0}
                </span>
              </div>
            </div>

            {importResult?.errors?.length > 0 && (
              <div className="text-left bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-1">
                <p className="font-semibold text-rose-900">Row-Level Validation Errors:</p>
                <ul className="list-disc list-inside text-rose-700 text-[11px] max-h-28 overflow-y-auto">
                  {importResult.errors.map((err: any, i: number) => (
                    <li key={i}>
                      Row {err.row}: {err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-3 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="crm-button-primary py-2 px-6"
              >
                View Leads in CRM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

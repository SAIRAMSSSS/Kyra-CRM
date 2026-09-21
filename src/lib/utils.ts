import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, fmt = "dd MMM yyyy"): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, fmt);
  } catch {
    return "—";
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, "dd MMM yyyy, hh:mm a");
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

export function isDateOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return isPast(d) && !isToday(d);
}

export function getStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  switch (s) {
    case "NEW":
      return "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20";
    case "ASSIGNED":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20";
    case "IN_PROGRESS":
    case "SCHEDULED":
      return "bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-500/20";
    case "CONTACTED":
      return "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20";
    case "FOLLOW_UP_REQUIRED":
    case "CALL_BACK":
      return "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/20";
    case "CONFIRM":
    case "CONFIRMED":
    case "QUALIFIED":
    case "INTERESTED":
      return "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20";
    case "CALL_BUSY":
      return "bg-orange-50 text-orange-800 border-orange-300 ring-1 ring-orange-500/20";
    case "SWITCHED_OFF":
      return "bg-violet-50 text-violet-800 border-violet-300 ring-1 ring-violet-500/20";
    case "NOT_CONNECTED":
    case "N_CON":
    case "N.CON":
      return "bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-500/20";
    case "NOT_INTERESTED":
    case "NI":
    case "N.I":
    case "CANCELLED":
    case "NO_SHOW":
    case "CLOSED":
      return "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-500/20";
    case "OTHERS":
      return "bg-zinc-100 text-zinc-800 border-zinc-300 ring-1 ring-zinc-500/20";
    case "SITE_VISIT_SCHEDULED":
      return "bg-teal-50 text-teal-800 border-teal-200 ring-1 ring-teal-500/20";
    case "SITE_VISIT_COMPLETED":
    case "COMPLETED":
    case "CONVERTED":
      return "bg-green-50 text-green-800 border-green-200 ring-1 ring-green-500/20";
    case "HIGH":
    case "URGENT":
      return "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/20";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20";
    case "LOW":
      return "bg-slate-50 text-slate-600 border-slate-200 ring-1 ring-slate-500/20";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function formatStatusLabel(status: string): string {
  if (!status) return "";
  const s = status.toUpperCase();
  if (s === "CONFIRM") return "Confirm";
  if (s === "CALL_BACK") return "Call back";
  if (s === "NOT_INTERESTED" || s === "N.I" || s === "NI") return "N.I";
  if (s === "NOT_CONNECTED" || s === "N.CON" || s === "N_CON") return "N.Con";
  if (s === "CALL_BUSY") return "Call busy";
  if (s === "SWITCHED_OFF") return "Switched off";
  if (s === "OTHERS") return "Others";

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatWhatsAppUrl(phone: string, customerName?: string, siteName?: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.length === 10) {
    clean = "91" + clean;
  }
  const greeting = customerName ? `Hello ${customerName}` : `Hello`;
  const property = siteName ? ` regarding ${siteName}` : ` regarding KYRA properties`;
  const text = `${greeting}, greetings from KYRA Group${property}! I am your dedicated relationship manager. Would you like more details or a site visit schedule?`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function formatTelUrl(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  return `tel:${clean}`;
}

export function formatMailtoUrl(email: string, customerName?: string, siteName?: string): string {
  const subject = `KYRA Group — Details for ${siteName || "Your Property Inquiry"}`;
  const body = `Dear ${customerName || "Sir/Madam"},\n\nThank you for your interest in KYRA Group's premier properties${siteName ? ` (${siteName})` : ""}.\n\nPlease find our project brochure and plot details attached.\n\nWarm regards,\nKYRA Relationship Team\nwww.kyragroupindia.com`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}


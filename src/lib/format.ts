import { format, parseISO } from "date-fns";

export const formatINR = (amount: number | string | null | undefined) => {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
};

export const formatDate = (date: string | Date | null | undefined, fmt = "dd MMM yyyy") => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  try {
    return format(d, fmt);
  } catch {
    return "—";
  }
};

export const SLOTS = [
  { id: "Slot 1", label: "Slot 1", time: "8:00 AM – 12:30 PM", short: "Morning", color: "slot-1" },
  { id: "Slot 2", label: "Slot 2", time: "1:00 PM – 5:00 PM", short: "Afternoon", color: "slot-2" },
  { id: "Slot 3", label: "Slot 3", time: "6:30 PM – 7:15 AM (next day)", short: "Evening / Night", color: "slot-3" },
] as const;

export const EVENT_TYPES = ["Wedding", "Reception", "Birthday", "Engagement", "Corporate", "Puja", "Other"] as const;
export const BOOKING_STATUSES = ["Confirmed", "Pending", "Cancelled"] as const;
export const LEAD_STAGES = ["New Inquiry", "Contacted", "Site Visit", "Negotiation", "Won", "Lost"] as const;
export const LEAD_SOURCES = ["WhatsApp", "Instagram", "Facebook", "Google", "Referral", "Walk-in", "Phone Call", "Other"] as const;
export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"] as const;

export const eventTypeColor = (t: string) => {
  const map: Record<string, string> = {
    Wedding: "bg-pink-500/20 text-pink-200 border-pink-500/30",
    Reception: "bg-purple-500/20 text-purple-200 border-purple-500/30",
    Birthday: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    Engagement: "bg-rose-500/20 text-rose-200 border-rose-500/30",
    Corporate: "bg-cyan-500/20 text-cyan-200 border-cyan-500/30",
    Puja: "bg-orange-500/20 text-orange-200 border-orange-500/30",
    Other: "bg-slate-500/20 text-slate-200 border-slate-500/30",
  };
  return map[t] ?? map.Other;
};

export const slotColor = (s: string) => {
  if (s === "Slot 1") return "bg-blue-500/20 text-blue-200 border-blue-500/40";
  if (s === "Slot 2") return "bg-orange-500/20 text-orange-200 border-orange-500/40";
  return "bg-purple-500/20 text-purple-200 border-purple-500/40";
};

export const statusColor = (s: string) => {
  if (s === "Confirmed") return "bg-green-500/20 text-green-300 border-green-500/40";
  if (s === "Pending") return "bg-orange-500/20 text-orange-300 border-orange-500/40";
  return "bg-red-500/20 text-red-300 border-red-500/40";
};

export const stageColor = (s: string) => {
  const map: Record<string, string> = {
    "New Inquiry": "bg-slate-500/20 text-slate-200 border-slate-500/40",
    Contacted: "bg-blue-500/20 text-blue-200 border-blue-500/40",
    "Site Visit": "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
    Negotiation: "bg-orange-500/20 text-orange-200 border-orange-500/40",
    Won: "bg-green-500/20 text-green-300 border-green-500/40",
    Lost: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return map[s] ?? map["New Inquiry"];
};

export const whatsappLink = (phone: string, name?: string) => {
  const digits = phone.replace(/\D/g, "");
  const num = digits.startsWith("91") ? digits : `91${digits}`;
  const text = name
    ? `Hello ${name}, thank you for your inquiry about Shukla Farms!`
    : "Hello, thank you for your inquiry about Shukla Farms!";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
};

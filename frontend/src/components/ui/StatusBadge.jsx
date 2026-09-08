import { STATUS_LABELS } from "@/lib/format";

const STYLES = {
  menunggu: "bg-amber-50 text-amber-700 border-amber-200",
  check_in: "bg-sky-50 text-sky-700 border-sky-200",
  pemeriksaan: "bg-indigo-50 text-indigo-700 border-indigo-200",
  dipanggil: "bg-sky-50 text-sky-700 border-sky-200",
  selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
  dilewati: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function StatusBadge({ status, testid }) {
  return (
    <span
      data-testid={testid}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border ${STYLES[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

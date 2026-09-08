import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import {
  Users, UserPlus, ListOrdered, Clock, CheckCircle2, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

const CARDS = [
  { key: "total_patients", label: "Total Pasien", icon: Users, color: "text-sky-600", bg: "bg-sky-50", testid: "stat-total-pasien" },
  { key: "patients_today", label: "Pasien Hari Ini", icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50", testid: "stat-pasien-hari-ini" },
  { key: "queues_today", label: "Antrean Hari Ini", icon: ListOrdered, color: "text-violet-600", bg: "bg-violet-50", testid: "stat-antrean-hari-ini" },
  { key: "waiting", label: "Pasien Menunggu", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", testid: "stat-menunggu" },
  { key: "served", label: "Selesai Dilayani", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", testid: "stat-selesai" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats(data.data);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  useEffect(() => { load(); }, []);

  const chartData = (stats?.chart || []).map((c) => ({
    date: new Date(c.date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    total: c.total,
  }));

  return (
    <div className="animate-fade-up" data-testid="dashboard-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Halo, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan aktivitas klinik · {formatDate(new Date().toISOString().slice(0, 10))}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {CARDS.map((c) => (
          <Card
            key={c.key}
            data-testid={c.testid}
            className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`h-11 w-11 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="text-3xl font-heading font-extrabold text-slate-900">
              {stats ? stats[c.key] : "–"}
            </p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-slate-200 shadow-sm">
          <h3 className="font-heading font-semibold text-slate-800 mb-1">Kunjungan 7 Hari Terakhir</h3>
          <p className="text-xs text-slate-500 mb-6">Jumlah pendaftaran pasien per hari</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="colorVisit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <Area type="monotone" dataKey="total" stroke="#0284C7" strokeWidth={2.5} fill="url(#colorVisit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-heading font-semibold text-slate-800 mb-1">Akses Cepat</h3>
          <p className="text-xs text-slate-500 mb-5">Navigasi menu utama</p>
          <div className="space-y-3">
            {(["admin", "petugas"].includes(user?.role)) && (
              <QuickLink label="Daftarkan Pasien Baru" onClick={() => navigate("/pendaftaran")} testid="quick-pendaftaran" />
            )}
            <QuickLink label="Kelola Antrean" onClick={() => navigate("/antrean")} testid="quick-antrean" />
            {(["admin", "dokter"].includes(user?.role)) && (
              <QuickLink label="Pemeriksaan Pasien" onClick={() => navigate("/pemeriksaan")} testid="quick-pemeriksaan" />
            )}
            <QuickLink label="Data Pasien" onClick={() => navigate("/pasien")} testid="quick-pasien" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ label, onClick, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors group"
    >
      <span className="text-sm font-medium">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
    </button>
  );
}

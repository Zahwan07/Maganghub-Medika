import { useEffect, useState, useCallback } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { todayISO } from "@/lib/format";
import {
  PhoneCall, SkipForward, CheckCircle2, Loader2, Volume2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function Queues() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [polis, setPolis] = useState([]);
  const [poliFilter, setPoliFilter] = useState("all");
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { date: todayISO() };
      if (poliFilter !== "all") params.poli_id = poliFilter;
      const { data } = await api.get("/queues", { params });
      setItems(data.data.items);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [poliFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    (async () => {
      try { const { data } = await api.get("/polis"); setPolis(data.data.items); } catch (e) { /* */ }
    })();
  }, []);

  const current = items.find((q) => q.status === "dipanggil");
  const waitingList = items.filter((q) => q.status === "menunggu");

  const chime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o.start(); o.stop(ctx.currentTime + 0.6);
    } catch (e) { /* ignore */ }
  };

  const callQueue = async (q) => {
    setActing(q.id);
    try {
      await api.put(`/queues/${q.id}/call`);
      chime();
      toast.success(`Memanggil antrean ${q.queue_number} — ${q.patient_name}`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally { setActing(null); }
  };

  const setStatus = async (q, status) => {
    setActing(q.id);
    try {
      await api.put(`/queues/${q.id}/status`, { status });
      toast.success(`Antrean ${q.queue_number} ${status === "selesai" ? "selesai" : "dilewati"}`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally { setActing(null); }
  };

  const callNext = async () => {
    if (waitingList.length === 0) { toast.info("Tidak ada antrean menunggu"); return; }
    await callQueue(waitingList[0]);
  };

  return (
    <div className="animate-fade-up" data-testid="queues-page">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Manajemen Antrean</h1>
          <p className="text-sm text-slate-500 mt-1">Papan antrean pasien hari ini</p>
        </div>
        <div className="flex gap-3">
          <Select value={poliFilter} onValueChange={setPoliFilter}>
            <SelectTrigger className="w-[180px] bg-white" data-testid="queue-poli-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Poli</SelectItem>
              {polis.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} data-testid="queue-refresh"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current call */}
        <Card className="bg-slate-900 text-white p-8 flex flex-col items-center justify-center text-center border-0 shadow-lg" data-testid="current-queue-display">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <Volume2 className="h-4 w-4" /> Sedang Dipanggil
          </p>
          {current ? (
            <>
              <p className="font-mono text-6xl font-black text-sky-400 mb-2 animate-pulse-ring inline-block px-2 rounded">{current.queue_number}</p>
              <p className="font-heading text-lg font-semibold">{current.patient_name}</p>
              <p className="text-sm text-slate-400">{current.poli_name}</p>
            </>
          ) : (
            <p className="font-mono text-5xl font-black text-slate-600">—</p>
          )}
        </Card>

        {/* Call next */}
        <Card className="lg:col-span-2 p-8 border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <p className="text-sm text-slate-500 mb-1">Antrean menunggu</p>
          <p className="font-heading text-5xl font-extrabold text-slate-900 mb-5" data-testid="waiting-count">{waitingList.length}</p>
          <Button
            data-testid="call-next-button"
            onClick={callNext}
            disabled={waitingList.length === 0 || acting}
            className="bg-sky-600 hover:bg-sky-700 h-12 px-8 text-base font-semibold"
          >
            <PhoneCall className="h-5 w-5 mr-2" /> Panggil Antrean Berikutnya
          </Button>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">No. Antrean</TableHead>
              <TableHead className="font-semibold">Pasien</TableHead>
              <TableHead className="font-semibold">Poli</TableHead>
              <TableHead className="font-semibold">Dokter</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Memuat...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">Belum ada antrean hari ini</TableCell></TableRow>
            ) : (
              items.map((q) => (
                <TableRow key={q.id} data-testid={`queue-row-${q.id}`} className="hover:bg-slate-50">
                  <TableCell><span className="font-mono font-bold text-lg text-sky-700">{q.queue_number}</span></TableCell>
                  <TableCell className="font-medium text-slate-800">{q.patient_name}</TableCell>
                  <TableCell>{q.poli_name}</TableCell>
                  <TableCell>{q.doctor_name}</TableCell>
                  <TableCell><StatusBadge status={q.status} testid={`queue-status-${q.id}`} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {q.status === "menunggu" && (
                        <Button size="sm" variant="outline" data-testid={`queue-call-${q.id}`} disabled={acting === q.id} onClick={() => callQueue(q)} className="text-sky-600 border-sky-200 hover:bg-sky-50">
                          <PhoneCall className="h-3.5 w-3.5 mr-1" /> Panggil
                        </Button>
                      )}
                      {(q.status === "menunggu" || q.status === "dipanggil") && (
                        <>
                          <Button size="sm" variant="outline" data-testid={`queue-finish-${q.id}`} disabled={acting === q.id} onClick={() => setStatus(q, "selesai")} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Selesai
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`queue-skip-${q.id}`} disabled={acting === q.id} onClick={() => setStatus(q, "dilewati")} className="text-slate-400 hover:text-rose-600">
                            <SkipForward className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, todayISO } from "@/lib/format";
import { Plus, Loader2, Check, ChevronsUpDown, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { patient_id: "", doctor_id: "", poli_id: "", visit_date: todayISO(), payment_type: "Umum", complaint: "" };

export default function Registrations() {
  const { user } = useAuth();
  const canCreate = ["admin", "petugas"].includes(user?.role);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [polis, setPolis] = useState([]);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { date: todayISO() };
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/registrations", { params });
      setItems(data.data.items);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const [d, p, pt] = await Promise.all([
          api.get("/doctors"),
          api.get("/polis"),
          api.get("/patients", { params: { limit: 100 } }),
        ]);
        setDoctors(d.data.data.items);
        setPolis(p.data.data.items);
        setPatients(pt.data.data.items);
      } catch (err) { /* ignore */ }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id || !form.poli_id) {
      toast.error("Pasien, dokter, dan poli wajib dipilih");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/registrations", form);
      toast.success(data.message);
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedPatient = patients.find((p) => String(p.id) === String(form.patient_id));

  return (
    <div className="animate-fade-up" data-testid="registrations-page">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Pendaftaran Kunjungan</h1>
          <p className="text-sm text-slate-500 mt-1">Pendaftaran pasien hari ini · {formatDate(todayISO())}</p>
        </div>
        {canCreate && (
          <Button data-testid="add-registration-button" onClick={() => { setForm(EMPTY); setOpen(true); }} className="bg-sky-600 hover:bg-sky-700">
            <Plus className="h-4 w-4 mr-2" /> Daftar Kunjungan
          </Button>
        )}
      </div>

      <div className="mb-5 flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] bg-white" data-testid="registration-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="menunggu">Menunggu</SelectItem>
            <SelectItem value="check_in">Check In</SelectItem>
            <SelectItem value="pemeriksaan">Pemeriksaan</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Antrean</TableHead>
              <TableHead className="font-semibold">Pasien</TableHead>
              <TableHead className="font-semibold">Poli</TableHead>
              <TableHead className="font-semibold">Dokter</TableHead>
              <TableHead className="font-semibold">Penjamin</TableHead>
              <TableHead className="font-semibold">Keluhan</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Memuat...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Belum ada pendaftaran hari ini</TableCell></TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id} data-testid={`registration-row-${r.id}`} className="hover:bg-slate-50">
                  <TableCell><span className="font-mono font-bold text-sky-700">{r.queue_number || "-"}</span></TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-800">{r.patient_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.medical_record_no}</div>
                  </TableCell>
                  <TableCell>{r.poli_name}</TableCell>
                  <TableCell>{r.doctor_name}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.payment_type === "BPJS" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{r.payment_type}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-slate-600">{r.complaint || "-"}</TableCell>
                  <TableCell><StatusBadge status={r.status} testid={`reg-status-${r.id}`} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-testid="registration-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><ClipboardList className="h-5 w-5 text-sky-600" />Pendaftaran Kunjungan</DialogTitle>
            <DialogDescription>Nomor antrean akan dibuat otomatis setelah pendaftaran.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pasien <span className="text-rose-500">*</span></Label>
              <Popover open={patientPickerOpen} onOpenChange={setPatientPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" data-testid="registration-patient-select" className="w-full justify-between font-normal">
                    {selectedPatient ? `${selectedPatient.name} · ${selectedPatient.medical_record_no}` : "Pilih pasien..."}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari nama / NIK..." data-testid="registration-patient-search" />
                    <CommandList>
                      <CommandEmpty>Pasien tidak ditemukan</CommandEmpty>
                      <CommandGroup>
                        {patients.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.nik} ${p.medical_record_no}`}
                            data-testid={`patient-option-${p.id}`}
                            onSelect={() => { setForm({ ...form, patient_id: p.id }); setPatientPickerOpen(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${String(form.patient_id) === String(p.id) ? "opacity-100" : "opacity-0"}`} />
                            <span>{p.name}</span>
                            <span className="ml-auto text-xs text-slate-400 font-mono">{p.medical_record_no}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Poli <span className="text-rose-500">*</span></Label>
                <Select value={String(form.poli_id)} onValueChange={(v) => setForm({ ...form, poli_id: v })}>
                  <SelectTrigger data-testid="registration-poli-select"><SelectValue placeholder="Pilih poli" /></SelectTrigger>
                  <SelectContent>
                    {polis.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dokter <span className="text-rose-500">*</span></Label>
                <Select value={String(form.doctor_id)} onValueChange={(v) => setForm({ ...form, doctor_id: v })}>
                  <SelectTrigger data-testid="registration-doctor-select"><SelectValue placeholder="Pilih dokter" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Kunjungan</Label>
                <Input type="date" data-testid="registration-date-input" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Jenis Pembayaran</Label>
                <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
                  <SelectTrigger data-testid="registration-payment-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Umum">Umum</SelectItem>
                    <SelectItem value="BPJS">BPJS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keluhan Awal</Label>
              <Textarea data-testid="registration-complaint-input" value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} placeholder="Keluhan utama pasien..." rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" data-testid="registration-submit-button" disabled={saving} className="bg-sky-600 hover:bg-sky-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Daftar & Buat Antrean"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

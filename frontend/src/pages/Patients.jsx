import { useEffect, useState, useCallback } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, genderLabel, calcAge } from "@/lib/format";
import {
  Search, Plus, Pencil, Eye, Trash2, ChevronLeft, ChevronRight, Loader2, FileText,
} from "lucide-react";
import { toast } from "sonner";

const EMPTY = { nik: "", name: "", gender: "L", birth_date: "", phone: "", address: "" };

export default function Patients() {
  const { user } = useAuth();
  const canEdit = ["admin", "petugas"].includes(user?.role);
  const canDelete = user?.role === "admin";

  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (gender !== "all") params.gender = gender;
      const { data } = await api.get("/patients", { params });
      setData(data.data);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, gender]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ nik: p.nik, name: p.name, gender: p.gender, birth_date: p.birth_date, phone: p.phone || "", address: p.address || "" });
    setErrors({});
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (editing) {
        await api.put(`/patients/${editing.id}`, form);
        toast.success("Data pasien diperbarui");
      } else {
        await api.post("/patients", form);
        toast.success("Pasien baru ditambahkan");
      }
      setFormOpen(false);
      setPage(1);
      load();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (p) => {
    setDetail(p);
    setHistory([]);
    try {
      const { data } = await api.get(`/medical-records/${p.id}`);
      setHistory(data.data.records || []);
    } catch (err) { /* ignore */ }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/patients/${deleteTarget.id}`);
      toast.success("Pasien dihapus");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="animate-fade-up" data-testid="patients-page">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Data Pasien</h1>
          <p className="text-sm text-slate-500 mt-1">Master data & rekam medis pasien klinik</p>
        </div>
        {canEdit && (
          <Button data-testid="add-patient-button" onClick={openAdd} className="bg-sky-600 hover:bg-sky-700">
            <Plus className="h-4 w-4 mr-2" /> Tambah Pasien
          </Button>
        )}
      </div>

      <Card className="p-4 mb-5 border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="patient-search-input"
              placeholder="Cari nama, NIK, atau no. rekam medis..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={gender} onValueChange={(v) => { setGender(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]" data-testid="patient-gender-filter">
              <SelectValue placeholder="Jenis Kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelamin</SelectItem>
              <SelectItem value="L">Laki-laki</SelectItem>
              <SelectItem value="P">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">No. RM</TableHead>
              <TableHead className="font-semibold">NIK</TableHead>
              <TableHead className="font-semibold">Nama</TableHead>
              <TableHead className="font-semibold">Kelamin</TableHead>
              <TableHead className="font-semibold">Tgl Lahir</TableHead>
              <TableHead className="font-semibold">Telepon</TableHead>
              <TableHead className="font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Memuat data...
              </TableCell></TableRow>
            ) : data.items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Tidak ada data pasien</TableCell></TableRow>
            ) : (
              data.items.map((p) => (
                <TableRow key={p.id} data-testid={`patient-row-${p.id}`} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm font-medium text-sky-700">{p.medical_record_no}</TableCell>
                  <TableCell className="font-mono text-sm">{p.nik}</TableCell>
                  <TableCell className="font-medium text-slate-800">{p.name}</TableCell>
                  <TableCell>{genderLabel(p.gender)}</TableCell>
                  <TableCell>{formatDate(p.birth_date)}</TableCell>
                  <TableCell>{p.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" data-testid={`patient-view-${p.id}`} onClick={() => openDetail(p)} className="h-8 w-8 text-slate-500 hover:text-sky-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button size="icon" variant="ghost" data-testid={`patient-edit-${p.id}`} onClick={() => openEdit(p)} className="h-8 w-8 text-slate-500 hover:text-indigo-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" data-testid={`patient-delete-${p.id}`} onClick={() => setDeleteTarget(p)} className="h-8 w-8 text-slate-500 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Total <span className="font-semibold text-slate-700">{data.pagination.total}</span> pasien
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" data-testid="pagination-prev" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600 px-2">Hal {data.pagination.page} / {data.pagination.totalPages}</span>
            <Button size="sm" variant="outline" data-testid="pagination-next" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" data-testid="patient-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Ubah Data Pasien" : "Tambah Pasien Baru"}</DialogTitle>
            <DialogDescription>Nomor Rekam Medis dibuat otomatis oleh sistem.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>NIK <span className="text-rose-500">*</span></Label>
                <Input data-testid="patient-nik-input" value={form.nik} maxLength={16}
                  onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })} placeholder="16 digit NIK" />
                {errors.nik && <p className="text-xs text-rose-500">{errors.nik}</p>}
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Nama Lengkap <span className="text-rose-500">*</span></Label>
                <Input data-testid="patient-name-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama pasien" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin <span className="text-rose-500">*</span></Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger data-testid="patient-gender-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir <span className="text-rose-500">*</span></Label>
                <Input type="date" data-testid="patient-birthdate-input" value={form.birth_date}
                  onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                {errors.birth_date && <p className="text-xs text-rose-500">{errors.birth_date}</p>}
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Nomor Telepon</Label>
                <Input data-testid="patient-phone-input" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Alamat</Label>
                <Input data-testid="patient-address-input" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat domisili" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" data-testid="patient-save-button" disabled={saving} className="bg-sky-600 hover:bg-sky-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="patient-detail-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Detail Pasien</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Info label="No. Rekam Medis" value={detail.medical_record_no} mono />
                <Info label="NIK" value={detail.nik} mono />
                <Info label="Nama" value={detail.name} />
                <Info label="Jenis Kelamin" value={genderLabel(detail.gender)} />
                <Info label="Tanggal Lahir" value={`${formatDate(detail.birth_date)} (${calcAge(detail.birth_date)})`} />
                <Info label="Telepon" value={detail.phone || "-"} />
                <div className="col-span-2"><Info label="Alamat" value={detail.address || "-"} /></div>
              </div>
              <div>
                <h4 className="font-heading font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-sky-600" /> Riwayat Pemeriksaan ({history.length})
                </h4>
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center border border-dashed rounded-lg">Belum ada riwayat pemeriksaan</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((r) => (
                      <div key={r.id} className="border border-slate-200 rounded-lg p-4" data-testid={`history-record-${r.id}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-slate-500">{formatDate(r.created_at)} · {r.poli_name}</span>
                          <span className="text-xs text-slate-500">{r.doctor_name}</span>
                        </div>
                        <p className="text-sm"><span className="font-semibold text-slate-700">Diagnosa:</span> {r.diagnosis || "-"}</p>
                        <p className="text-sm text-slate-600 mt-1"><span className="font-semibold text-slate-700">Terapi:</span> {r.therapy_plan || "-"}</p>
                        {r.prescriptions?.length > 0 && (
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-semibold text-slate-700">Resep:</span> {r.prescriptions.flatMap((p) => p.items.map((i) => i.drug_name)).join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="patient-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pasien?</AlertDialogTitle>
            <AlertDialogDescription>
              Data pasien <b>{deleteTarget?.name}</b> beserta seluruh riwayatnya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-delete-button" onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm text-slate-800 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, todayISO, calcAge, genderLabel } from "@/lib/format";
import {
  Stethoscope, Loader2, Plus, Trash2, Pill, Activity, Save, ClipboardCheck,
  FileClock, User,
} from "lucide-react";
import { toast } from "sonner";

const EMPTY_SOAP = {
  subjective: "", blood_pressure: "", temperature: "", weight: "", height: "", pulse: "",
  diagnosis: "", therapy_plan: "",
};

export default function Examination() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [soap, setSoap] = useState(EMPTY_SOAP);
  const [actions, setActions] = useState([]);
  const [meds, setMeds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("soap");

  const loadRegs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/registrations", { params: { date: todayISO() } });
      setRegs(data.data.items.filter((r) => r.status !== "selesai"));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRegs(); }, [loadRegs]);

  const selectReg = async (r) => {
    setSelected(r);
    setSoap({ ...EMPTY_SOAP, subjective: r.complaint || "" });
    setActions([]);
    setMeds([]);
    setTab("soap");
    setHistory([]);
    try {
      const { data } = await api.get(`/medical-records/${r.patient_id}`);
      setHistory(data.data.records || []);
    } catch (err) { /* ignore */ }
  };

  const addAction = () => setActions([...actions, { action_name: "", notes: "" }]);
  const addMed = () => setMeds([...meds, { drug_name: "", dosage: "", instruction: "", quantity: "" }]);

  const save = async () => {
    if (!selected) return;
    if (!soap.diagnosis.trim()) { toast.error("Diagnosa (Assessment) wajib diisi"); return; }
    setSaving(true);
    try {
      const payload = {
        registration_id: selected.id,
        ...soap,
        temperature: soap.temperature || null,
        weight: soap.weight || null,
        height: soap.height || null,
        pulse: soap.pulse || null,
        actions: actions.filter((a) => a.action_name.trim()),
      };
      const { data } = await api.post("/medical-records", payload);
      const mrId = data.data.medical_record.id;

      const validMeds = meds.filter((m) => m.drug_name.trim());
      if (validMeds.length > 0) {
        await api.post("/prescriptions", { medical_record_id: mrId, items: validMeds });
      }
      toast.success("Hasil pemeriksaan & resep tersimpan");
      setSelected(null);
      setSoap(EMPTY_SOAP);
      setActions([]);
      setMeds([]);
      loadRegs();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-up" data-testid="examination-page">
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Pemeriksaan Dokter</h1>
        <p className="text-sm text-slate-500 mt-1">Pencatatan pemeriksaan dengan metode SOAP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient queue list */}
        <Card className="lg:col-span-4 border-slate-200 shadow-sm p-4 h-fit">
          <h3 className="font-heading font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-sky-600" /> Antrean Pemeriksaan
          </h3>
          {loading ? (
            <div className="py-8 text-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : regs.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Tidak ada pasien menunggu pemeriksaan</p>
          ) : (
            <div className="space-y-2">
              {regs.map((r) => (
                <button
                  key={r.id}
                  data-testid={`exam-patient-${r.id}`}
                  onClick={() => selectReg(r)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selected?.id === r.id ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-700">{r.queue_number}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="font-medium text-slate-800 mt-1">{r.patient_name}</p>
                  <p className="text-xs text-slate-400">{r.poli_name} · {r.payment_type}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* SOAP workspace */}
        <div className="lg:col-span-8">
          {!selected ? (
            <Card className="border-slate-200 border-dashed shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Stethoscope className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-heading font-semibold text-slate-700">Pilih Pasien</p>
              <p className="text-sm text-slate-400 mt-1">Pilih pasien dari antrean untuk memulai pemeriksaan</p>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Patient header */}
              <Card className="border-slate-200 shadow-sm p-5" data-testid="exam-patient-header">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-slate-900 text-lg">{selected.patient_name}</p>
                    <p className="text-sm text-slate-500">
                      {selected.medical_record_no} · {genderLabel(selected.gender)} · {selected.poli_name}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-2xl text-sky-700">{selected.queue_number}</span>
                </div>
              </Card>

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="soap" data-testid="tab-soap">Pemeriksaan SOAP</TabsTrigger>
                  <TabsTrigger value="history" data-testid="tab-history">
                    <FileClock className="h-4 w-4 mr-1.5" /> Riwayat ({history.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="soap" className="space-y-5 mt-5">
                  {/* Subjective */}
                  <Card className="border-slate-200 shadow-sm p-5">
                    <SectionTitle letter="S" title="Subjective" desc="Keluhan pasien" />
                    <Textarea data-testid="soap-subjective-input" value={soap.subjective}
                      onChange={(e) => setSoap({ ...soap, subjective: e.target.value })}
                      placeholder="Keluhan yang dirasakan pasien..." rows={3} className="mt-3" />
                  </Card>

                  {/* Objective */}
                  <Card className="border-slate-200 shadow-sm p-5">
                    <SectionTitle letter="O" title="Objective" desc="Tanda vital pasien" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
                      <Vital label="Tekanan Darah (mmHg)" testid="soap-bp-input" value={soap.blood_pressure} onChange={(v) => setSoap({ ...soap, blood_pressure: v })} placeholder="120/80" />
                      <Vital label="Suhu Tubuh (°C)" testid="soap-temp-input" value={soap.temperature} onChange={(v) => setSoap({ ...soap, temperature: v })} placeholder="36.5" type="number" />
                      <Vital label="Nadi (bpm)" testid="soap-pulse-input" value={soap.pulse} onChange={(v) => setSoap({ ...soap, pulse: v })} placeholder="80" type="number" />
                      <Vital label="Berat Badan (kg)" testid="soap-weight-input" value={soap.weight} onChange={(v) => setSoap({ ...soap, weight: v })} placeholder="60" type="number" />
                      <Vital label="Tinggi Badan (cm)" testid="soap-height-input" value={soap.height} onChange={(v) => setSoap({ ...soap, height: v })} placeholder="165" type="number" />
                    </div>
                  </Card>

                  {/* Assessment */}
                  <Card className="border-slate-200 shadow-sm p-5">
                    <SectionTitle letter="A" title="Assessment" desc="Diagnosa" />
                    <Textarea data-testid="soap-diagnosis-input" value={soap.diagnosis}
                      onChange={(e) => setSoap({ ...soap, diagnosis: e.target.value })}
                      placeholder="Diagnosa pasien..." rows={2} className="mt-3" />
                  </Card>

                  {/* Plan */}
                  <Card className="border-slate-200 shadow-sm p-5">
                    <SectionTitle letter="P" title="Plan" desc="Rencana terapi" />
                    <Textarea data-testid="soap-plan-input" value={soap.therapy_plan}
                      onChange={(e) => setSoap({ ...soap, therapy_plan: e.target.value })}
                      placeholder="Rencana terapi & tindak lanjut..." rows={2} className="mt-3" />
                  </Card>

                  {/* Tindakan Medis */}
                  <Card className="border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        <h4 className="font-heading font-semibold text-slate-800">Tindakan Medis</h4>
                      </div>
                      <Button size="sm" variant="outline" data-testid="add-action-button" onClick={addAction}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
                    </div>
                    {actions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-3">Belum ada tindakan medis</p>
                    ) : (
                      <div className="space-y-2">
                        {actions.map((a, i) => (
                          <div key={i} className="flex gap-2" data-testid={`action-row-${i}`}>
                            <Input placeholder="Nama tindakan" value={a.action_name} data-testid={`action-name-${i}`}
                              onChange={(e) => { const n = [...actions]; n[i].action_name = e.target.value; setActions(n); }} />
                            <Input placeholder="Catatan (opsional)" value={a.notes}
                              onChange={(e) => { const n = [...actions]; n[i].notes = e.target.value; setActions(n); }} />
                            <Button size="icon" variant="ghost" onClick={() => setActions(actions.filter((_, x) => x !== i))} className="text-rose-500 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Resep Obat */}
                  <Card className="border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-emerald-600" />
                        <h4 className="font-heading font-semibold text-slate-800">Resep Obat</h4>
                      </div>
                      <Button size="sm" variant="outline" data-testid="add-medicine-button" onClick={addMed}><Plus className="h-4 w-4 mr-1" />Tambah Obat</Button>
                    </div>
                    {meds.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-3">Belum ada resep obat</p>
                    ) : (
                      <div className="space-y-2">
                        {meds.map((m, i) => (
                          <div key={i} className="grid grid-cols-12 gap-2" data-testid={`med-row-${i}`}>
                            <Input className="col-span-4" placeholder="Nama obat" value={m.drug_name} data-testid={`med-name-${i}`}
                              onChange={(e) => { const n = [...meds]; n[i].drug_name = e.target.value; setMeds(n); }} />
                            <Input className="col-span-3" placeholder="Dosis (500mg)" value={m.dosage}
                              onChange={(e) => { const n = [...meds]; n[i].dosage = e.target.value; setMeds(n); }} />
                            <Input className="col-span-3" placeholder="Aturan (3x1)" value={m.instruction}
                              onChange={(e) => { const n = [...meds]; n[i].instruction = e.target.value; setMeds(n); }} />
                            <Input className="col-span-1" placeholder="Qty" type="number" value={m.quantity}
                              onChange={(e) => { const n = [...meds]; n[i].quantity = e.target.value; setMeds(n); }} />
                            <Button size="icon" variant="ghost" onClick={() => setMeds(meds.filter((_, x) => x !== i))} className="col-span-1 text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <div className="flex justify-end gap-3 sticky bottom-4">
                    <Button variant="outline" onClick={() => setSelected(null)}>Batal</Button>
                    <Button data-testid="save-examination-button" onClick={save} disabled={saving} className="bg-sky-600 hover:bg-sky-700 shadow-lg h-11 px-6">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Simpan Pemeriksaan</>}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-5">
                  {history.length === 0 ? (
                    <Card className="border-slate-200 border-dashed p-12 text-center text-slate-400">Belum ada riwayat pemeriksaan</Card>
                  ) : (
                    <div className="space-y-3">
                      {history.map((r) => (
                        <Card key={r.id} className="border-slate-200 shadow-sm p-5" data-testid={`exam-history-${r.id}`}>
                          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                            <span className="text-sm font-semibold text-slate-700">{formatDate(r.created_at)}</span>
                            <span className="text-xs text-slate-500">{r.poli_name} · {r.doctor_name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <HistItem label="Keluhan (S)" value={r.subjective} />
                            <HistItem label="Vital (O)" value={`TD ${r.blood_pressure || "-"}, Suhu ${r.temperature || "-"}°C, BB ${r.weight || "-"}kg`} />
                            <HistItem label="Diagnosa (A)" value={r.diagnosis} />
                            <HistItem label="Terapi (P)" value={r.therapy_plan} />
                          </div>
                          {r.prescriptions?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Resep Obat</p>
                              <ul className="text-sm text-slate-600 list-disc list-inside">
                                {r.prescriptions.flatMap((p) => p.items).map((it, x) => (
                                  <li key={x}>{it.drug_name} {it.dosage} — {it.instruction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ letter, title, desc }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-heading font-bold">{letter}</div>
      <div>
        <h4 className="font-heading font-semibold text-slate-800 leading-tight">{title}</h4>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

function Vital({ label, value, onChange, placeholder, type = "text", testid }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-500">{label}</Label>
      <Input data-testid={testid} type={type} step="any" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function HistItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-slate-700 mt-0.5">{value || "-"}</p>
    </div>
  );
}

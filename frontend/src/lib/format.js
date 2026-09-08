export const ROLE_LABELS = {
  admin: "Administrator",
  dokter: "Dokter",
  petugas: "Petugas Pendaftaran",
};

export const STATUS_LABELS = {
  menunggu: "Menunggu",
  check_in: "Check In",
  pemeriksaan: "Pemeriksaan",
  selesai: "Selesai",
  dipanggil: "Dipanggil",
  dilewati: "Dilewati",
};

export const PAYMENT_LABELS = { BPJS: "BPJS", Umum: "Umum" };

export function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d.length <= 10 ? d + "T00:00:00" : d);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "-";
  const date = new Date(d.replace(" ", "T"));
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function calcAge(birth) {
  if (!birth) return "-";
  const b = new Date(birth);
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + " thn";
}

export function genderLabel(g) {
  return g === "L" ? "Laki-laki" : g === "P" ? "Perempuan" : "-";
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

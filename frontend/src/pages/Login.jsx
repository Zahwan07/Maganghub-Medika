import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, Loader2, User, Lock } from "lucide-react";
import { toast } from "sonner";

const DEMO = [
  { role: "Administrator", username: "admin", password: "admin123" },
  { role: "Dokter", username: "dokter", password: "dokter123" },
  { role: "Petugas", username: "petugas", password: "petugas123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(username, password);
      toast.success(`Selamat datang, ${u.name}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="flex items-center gap-3 relative">
          <div className="h-11 w-11 rounded-xl bg-sky-500 flex items-center justify-center">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="font-heading font-bold text-lg">Klinik Pratama</span>
        </div>
        <div className="relative">
          <h1 className="font-heading text-4xl font-extrabold leading-tight mb-4">
            Mini Clinic<br />Information System
          </h1>
          <p className="text-slate-300 max-w-md leading-relaxed">
            Kelola data pasien, pendaftaran kunjungan, antrean, hingga pemeriksaan dokter
            dengan metode SOAP dalam satu sistem terintegrasi.
          </p>
        </div>
        <p className="text-xs text-slate-500 relative">© 2026 Klinik Pratama · Sistem Informasi Klinik</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-slate-900">Klinik Pratama</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-slate-900">Masuk ke Sistem</h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">Silakan masuk menggunakan akun Anda.</p>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  data-testid="login-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="masukkan username"
                  className="pl-10 h-11"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
            </Button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Akun Demo</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  data-testid={`demo-${d.username}`}
                  onClick={() => { setUsername(d.username); setPassword(d.password); }}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700">{d.role}</span>
                  <span className="font-mono text-xs text-slate-500">{d.username} / {d.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

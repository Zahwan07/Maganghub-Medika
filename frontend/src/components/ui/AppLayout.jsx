import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/format";
import {
  LayoutDashboard, Users, ClipboardList, ListOrdered, Stethoscope,
  LogOut, HeartPulse,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "dokter", "petugas"] },
  { to: "/pasien", label: "Data Pasien", icon: Users, roles: ["admin", "dokter", "petugas"] },
  { to: "/pendaftaran", label: "Pendaftaran", icon: ClipboardList, roles: ["admin", "petugas"] },
  { to: "/antrean", label: "Antrean", icon: ListOrdered, roles: ["admin", "dokter", "petugas"] },
  { to: "/pemeriksaan", label: "Pemeriksaan", icon: Stethoscope, roles: ["admin", "dokter"] },
];

const ROLE_BADGE = {
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  dokter: "bg-emerald-100 text-emerald-800 border-emerald-200",
  petugas: "bg-sky-100 text-sky-800 border-sky-200",
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter((n) => n.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl border-r border-slate-800">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center space-x-3">
          <img src="/inova192.png" alt="Inova Medika Logo" className="h-10 w-10 rounded-xl object-contain" />
          <div>
            <p className="font-heading font-bold text-white text-base leading-tight">Inova Medika</p>
            <p className="text-xs text-slate-400">Information System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.to.slice(1)}`}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-lg flex items-center space-x-3 transition-colors ${isActive
                  ? "bg-slate-800 text-white font-medium"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`
              }
            >
              <n.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full px-4 py-2.5 rounded-lg flex items-center space-x-3 text-slate-400 hover:text-white hover:bg-rose-600/90 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-end px-8 shadow-sm ml-64">
        <div className="flex items-center gap-3" data-testid="header-user">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${ROLE_BADGE[user?.role]}`}>
              {ROLE_LABELS[user?.role]}
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
            {initials}
          </div>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}

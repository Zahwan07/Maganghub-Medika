import { createContext, useContext, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("clinic_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/login", { username, password });
    const { token, user: u } = data.data;
    localStorage.setItem("clinic_token", token);
    localStorage.setItem("clinic_user", JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/logout"); } catch (e) { /* ignore */ }
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

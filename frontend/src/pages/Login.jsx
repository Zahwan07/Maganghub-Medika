import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      // Basic login wiring, no loading state or toast notifications yet
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Login gagal, periksa username dan password."); // Simple native alert for early stage
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login Klinik</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Informasi Klinik</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>
      </div>
    </div>
  );
}
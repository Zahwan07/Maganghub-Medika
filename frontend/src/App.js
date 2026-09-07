import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { Toaster } from "@/components/ui/sonner";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Registrations from "@/pages/Registrations";
import Queues from "@/pages/Queues";
import Examination from "@/pages/Examination";

function Protected({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/pasien" element={<Protected><Patients /></Protected>} />
          <Route path="/pendaftaran" element={<Protected roles={["admin", "petugas"]}><Registrations /></Protected>} />
          <Route path="/antrean" element={<Protected><Queues /></Protected>} />
          <Route path="/pemeriksaan" element={<Protected roles={["admin", "dokter"]}><Examination /></Protected>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;

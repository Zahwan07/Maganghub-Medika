import axios from "axios";

const BACKEND_URL = "http://localhost:8001";
export const API = `${BACKEND_URL}/api`;

console.log("BACKEND_URL =", BACKEND_URL);
console.log("API =", API);

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("clinic_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("clinic_token");
      localStorage.removeItem("clinic_user");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function apiErrorMessage(err) {
  const data = err.response?.data;
  if (!data) return err.message || "Terjadi kesalahan";
  if (data.errors && typeof data.errors === "object") {
    const vals = Object.values(data.errors).filter((v) => typeof v === "string");
    if (vals.length) return `${data.message}: ${vals.join(", ")}`;
  }
  return data.message || "Terjadi kesalahan";
}

export default api;

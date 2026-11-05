// Cliente HTTP para FastAPI. No contiene datos ficticios ni credenciales.
// En desarrollo Vite reenvía /api/* a FastAPI (ver vite.config.js).
const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function apiFetch(path, { token, body, headers = {}, ...options } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData && body != null ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body != null ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; }
  catch { data = raw; }
  if (!response.ok) {
    if (response.status === 401 && path !== "/administrador/login") {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("token_expira");
      sessionStorage.removeItem("administrador");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login?sesion=expirada");
      }
    }
    const detail = typeof data === "object" && data !== null ? data.detail : data;
    const error = new Error(typeof detail === "string" ? detail : `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

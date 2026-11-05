// Cliente HTTP para FastAPI. No contiene datos ficticios ni credenciales.
// En desarrollo Vite reenvía /api/* a FastAPI (ver vite.config.js).
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Origen del backend. En producción VITE_API_URL es absoluta y en desarrollo
// apunta a Vite, que reenvía /api, /fotos y /uploads a FastAPI.
export const API_ORIGIN = (() => {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    return new URL(API_URL, base).origin;
  } catch {
    return "";
  }
})();

// Convierte una ruta del backend (/fotos/..., /uploads/...) en una URL que el
// navegador puede cargar desde el frontend desplegado en otro dominio.
export function resolverUrl(value) {
  const url = value == null ? "" : String(value).trim();
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

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

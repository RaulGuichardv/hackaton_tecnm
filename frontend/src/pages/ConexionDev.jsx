import { useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

/** Pantalla ÚNICAMENTE para npm run dev. No aparece en la compilación publicada. */
export default function ConexionDev() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  async function probar() {
    setLoading(true);
    const resultados = [];
    try {
      const schema = await apiFetch("/openapi.json");
      resultados.push({ nombre: "FastAPI (OpenAPI)", ok: Boolean(schema?.openapi), descripcion: schema?.info?.title || "API encontrada" });
    } catch (err) {
      resultados.push({ nombre: "FastAPI (OpenAPI)", ok: false, descripcion: err.message });
    }
    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Inicia sesión como administrador para consultar la API.");
      const workers = await apiFetch(ENDPOINTS.listar, { token });
      resultados.push({ nombre: "MariaDB a través del GET de trabajadores", ok: Array.isArray(workers), descripcion: Array.isArray(workers) ? `${workers.length} registros (no se muestran datos personales)` : "La API no devolvió una lista" });
    } catch (err) {
      resultados.push({ nombre: "MariaDB a través del GET de trabajadores", ok: false, descripcion: err.message });
    }
    setChecks(resultados);
    setLoading(false);
  }
  return <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
    <h1 className="mb-2 text-2xl font-bold">Prueba local: React ↔ FastAPI</h1>
    <p className="mb-5 text-sm text-slate-600">Solo aparece en modo desarrollo. La API exige un token de administrador; inicia sesión primero. No se muestran trabajadores, CURP ni datos de emergencia.</p>
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <button type="button" disabled={loading} onClick={probar} className="rounded-lg bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-50">{loading ? "Probando..." : "Probar conexión"}</button>
      <div className="mt-4 grid gap-3">{checks.map(c => <article key={c.nombre} className={`rounded-lg border p-3 ${c.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}><strong>{c.ok ? "✓ " : "✕ "}{c.nombre}</strong><p className="text-sm">{c.descripcion}</p></article>)}</div>
    </div>
    <p className="mt-6 text-sm text-slate-600">Para abrir las vistas administrativas inicia sesión con una cuenta válida. <Link to="/login" className="text-sky-700 underline">Ir al login</Link>.</p>
  </main>;
}

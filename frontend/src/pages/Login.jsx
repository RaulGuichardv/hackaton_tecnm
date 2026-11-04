
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, LockKeyhole } from "lucide-react";
import { apiFetch } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const respuesta = await apiFetch("/auth/login", {
        method: "POST",
        body: {
          correo: correo,
          password: password,
        },
      });

      const token = respuesta.access_token ?? respuesta.token;

      if (!token) {
        throw new Error("El servidor no devolvió un token");
      }

      sessionStorage.setItem("token", token);

      navigate("/admin", { replace: true });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-12 sm:grid sm:place-items-center">

      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-10">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-3 text-sky-800">
            <Building2 size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Credetec
            </h1>
            <p className="text-sm text-slate-500">
              Acceso administrativo
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={login} className="grid gap-4">

          <label className="field-label">
            Correo de administrador

            <input
              className="field"
              type="email"
              placeholder="administrador@institucion.mx"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </label>

          <label className="field-label">
            Contraseña

            <input
              className="field"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
          >
            <LockKeyhole size={18} />

            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

        </form>

        {import.meta.env.DEV && (
          <p className="mt-5 text-center text-sm">
            <Link
              to="/dev/conexion"
              className="text-sky-700 underline"
            >
              Probar conexión local con FastAPI
            </Link>
          </p>
        )}

        <p className="mt-5 text-center text-xs text-slate-500">
          Sistema de credencialización
        </p>

      </div>
    </div>
  );
}

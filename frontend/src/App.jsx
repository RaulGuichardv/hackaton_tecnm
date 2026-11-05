import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/Commons";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trabajadores from "./pages/Trabajadores";
import TrabajadorForm from "./pages/TrabajadorForm";
import Credenciales from "./pages/Credenciales";
import DetalleCredencial from "./pages/DetalleCredencial";
import Verificar from "./pages/Verificar";
import Reportes from "./pages/Reportes";
import ConexionDev from "./pages/ConexionDev";

const EscanearQR = lazy(() => import("./pages/EscanearQR"));

function AdminGuard() {
  // La API valida el token en cada operación; aquí además evitamos mostrar el
  // panel cuando la sesión ya expiró según la fecha entregada por el backend.
  const token = sessionStorage.getItem("token");
  const expira = Number(sessionStorage.getItem("token_expira") || 0);
  const allowed = Boolean(token) && (!expira || Date.now() < expira);
  if (!allowed) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("token_expira");
    sessionStorage.removeItem("administrador");
  }
  return allowed ? <Layout/> : <Navigate to="/login" replace/>;
}
export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace/>}/>
    <Route path="/login" element={<Login/>}/>
    {import.meta.env.DEV && <Route path="/dev/conexion" element={<ConexionDev/>}/>}
    <Route path="/verify/:token" element={<Verificar/>}/>
    <Route path="/verificar/:token" element={<Verificar/>}/>
    <Route path="/admin" element={<AdminGuard/>}>
      <Route index element={<Dashboard/>}/>
      <Route path="trabajadores" element={<Trabajadores/>}/>
      <Route path="trabajadores/nuevo" element={<TrabajadorForm/>}/>
      <Route path="trabajadores/:id/editar" element={<TrabajadorForm/>}/>
      <Route path="credenciales" element={<Credenciales/>}/>
      <Route path="credenciales/:id" element={<DetalleCredencial/>}/>
      <Route path="escanear" element={<Suspense fallback={<p className="text-sm text-slate-500">Cargando escáner…</p>}><EscanearQR/></Suspense>}/>
      <Route path="reportes" element={<Reportes/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/login" replace/>}/>
  </Routes>;
}

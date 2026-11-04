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

function AdminGuard() {
  // UI guard: la API DEBE validar los permisos de cada operación.
  const allowed = Boolean(sessionStorage.getItem("token"));
  return allowed ? <Layout/> : <Navigate to="/login" replace/>;
}
export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace/>}/>
    <Route path="/login" element={<Login/>}/>
    {import.meta.env.DEV && <Route path="/dev/conexion" element={<ConexionDev/>}/>}
    <Route path="/verificar/:token" element={<Verificar/>}/>
    <Route path="/admin" element={<AdminGuard/>}>
      <Route index element={<Dashboard/>}/>
      <Route path="trabajadores" element={<Trabajadores/>}/>
      <Route path="trabajadores/nuevo" element={<TrabajadorForm/>}/>
      <Route path="trabajadores/:id/editar" element={<TrabajadorForm/>}/>
      <Route path="credenciales" element={<Credenciales/>}/>
      <Route path="credenciales/:id" element={<DetalleCredencial/>}/>
      <Route path="reportes" element={<Reportes/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/login" replace/>}/>
  </Routes>;
}

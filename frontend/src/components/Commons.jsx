import { Badge } from "flowbite-react";
import { NavLink, Outlet, Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, UsersRound, IdCard, ChartColumn, Menu, X, LogOut, ShieldCheck, QrCode } from "lucide-react";
import logoPrincipal from "../assets/logo_principal.png";

export function Estado({ estado }) {
  const map = {
    vigente: { label: "Vigente", color: "success" },
    inactiva: { label: "Inactiva", color: "failure" },
    vencida: { label: "Vencida", color: "warning" },
    no_vigente: { label: "No vigente", color: "gray" },
    sin_datos: { label: "Sin estado", color: "gray" },
  };
  const data = map[estado] || { label: estado || "Sin estado", color: "gray" };
  return <Badge color={data.color} className="w-fit whitespace-nowrap">{data.label}</Badge>;
}

const menu = [
  ["/admin", "Resumen", LayoutDashboard],
  ["/admin/trabajadores", "Trabajadores", UsersRound],
  ["/admin/credenciales", "Credenciales", IdCard],
  ["/admin/escanear", "Escanear QR", QrCode],
  ["/admin/reportes", "Reportes", ChartColumn],
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);
  let admin = {};
  try { admin = JSON.parse(sessionStorage.getItem("administrador") || "{}"); } catch { admin = {}; }
  const salir = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("token_expira");
    sessionStorage.removeItem("administrador");
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
        <button onClick={() => setOpen(!open)} aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} className="rounded-lg p-2 hover:bg-slate-100">
          {open ? <X size={24}/> : <Menu size={24}/>}
        </button>
        <strong className="text-sky-900">Credetec</strong>
        <span className="text-xs text-slate-500">Sistema de credencialización</span>
      </header>
      {open && <button className="no-print fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={close} aria-label="Cerrar navegación"/>}
      <aside className={`no-print fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-slate-900 px-4 py-7 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <Link to="/admin" onClick={close} className="flex items-center gap-3 px-3 pb-8 text-xl font-bold"><img src={logoPrincipal} alt="Logo" className="h-8 w-8 object-contain"/><span className="ml-1">Credetec</span></Link>
        <div className="mb-4 px-3 text-xs uppercase tracking-widest text-slate-400">Panel de administración</div>
        <nav className="grid gap-1">
          {menu.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/admin"} onClick={close} className={({isActive}) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <Icon size={19}/> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 rounded-xl bg-slate-800 p-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-white">{admin?.nombre || "Administrador"}</p>
        </div>
        <button onClick={salir} className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"><LogOut size={17}/> Cerrar sesión</button>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-9"><Outlet/></main>
    </div>
  );
}

export function PageHead({title, description, children}) {
  return <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p></div><div className="no-print flex flex-wrap gap-2">{children}</div></div>;
}
export function ErrorMessage({ error }) { return error ? <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null; }
export function Avatar({worker, size="md"}) {
  const dimension = size === "lg" ? "h-24 w-24 text-2xl" : "h-10 w-10 text-xs";
  const [errorFoto, setErrorFoto] = useState(false);
  useEffect(() => setErrorFoto(false), [worker?.foto]);
  return worker?.foto && !errorFoto
    ? <img src={worker.foto} alt={`Fotografía de ${worker.nombre_completo}`} onError={() => setErrorFoto(true)} className={`${dimension} rounded-xl object-cover`}/>
    : <div aria-label="Sin fotografía" className={`${dimension} grid shrink-0 place-content-center rounded-xl bg-sky-100 font-bold text-sky-800`}>{worker?.nombre_completo?.split(" ").slice(0,2).map(x=>x[0]).join("") || "?"}</div>;
}
export function PrivadoAviso(){return <p className="mt-4 flex items-start gap-2 text-xs text-slate-500"><ShieldCheck size={16} className="shrink-0"/> La vista pública no expone CURP ni contactos de emergencia.</p>}

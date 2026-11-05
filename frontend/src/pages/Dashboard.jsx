import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "flowbite-react";
import { UsersRound, IdCard, CheckCircle2, AlertTriangle, Plus, ArrowRight, QrCode } from "lucide-react";
import { PageHead, Estado, ErrorMessage } from "../components/Commons";
import { listarTrabajadores } from "../services/credenciales";
import { calcularEstado } from "../utils/estado";

export default function Dashboard() {
  const [items, setItems] = useState([]), [error, setError] = useState("");
  useEffect(() => { listarTrabajadores().then(v=>setItems(v.resultados)).catch(e => setError(e.message)); }, []);
  const all = items.map(w => ({...w, estado: calcularEstado(w)}));
  const cards = [
    ["Trabajadores", items.length, UsersRound, "bg-sky-50 text-sky-800"],
    ["Credenciales", items.length, IdCard, "bg-slate-100 text-slate-800"],
    ["Vigentes", all.filter(w=>w.estado==="vigente").length, CheckCircle2, "bg-emerald-50 text-emerald-800"],
    ["Otras situaciones", all.filter(w=>w.estado!=="vigente").length, AlertTriangle, "bg-amber-50 text-amber-800"],
  ];
  return <>
    <PageHead title="Panel general" description="Resumen de trabajadores y vigencias registrados."><Link to="/admin/escanear"><Button color="light"><QrCode size={16} className="mr-2"/>Escanear QR</Button></Link><Link to="/admin/trabajadores/nuevo"><Button><Plus size={16} className="mr-2"/>Nuevo trabajador</Button></Link></PageHead>
    <ErrorMessage error={error}/>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon,cls])=><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}><Icon size={20}/></div><div className="text-3xl font-bold">{value}</div><div className="text-sm text-slate-500">{label}</div></div>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Estados contemplados</h2><p className="mb-5 mt-1 text-sm text-slate-500">La vigencia depende de las fechas y la activación.</p><div className="grid gap-3">{["vigente", "inactiva", "vencida", "no_vigente"].map(s=><div key={s} className="flex items-center justify-between border-b border-slate-100 py-2"><Estado estado={s}/><strong>{all.filter(w=>w.estado===s).length}</strong></div>)}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Acciones rápidas</h2><div className="mt-4 grid gap-3">{[["Administrar trabajadores","/admin/trabajadores"],["Ver credenciales","/admin/credenciales"],["Consultar reportes","/admin/reportes"]].map(([label,to])=><Link key={to} to={to} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-sm font-medium hover:bg-slate-50">{label}<ArrowRight size={17}/></Link>)}</div></section></div>
  </>;
}

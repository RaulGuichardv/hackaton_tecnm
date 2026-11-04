import { useEffect, useMemo, useState } from "react";
import { Button } from "flowbite-react";
import { Printer, ChartColumn } from "lucide-react";
import { PageHead, Estado, ErrorMessage } from "../components/Commons";
import { listarTrabajadores } from "../services/credenciales";
import { calcularEstado } from "../utils/estado";
import { datePretty } from "../components/CredentialCard";

export default function Reportes() {
  const [items,setItems]=useState([]),[area,setArea]=useState("todas"),[state,setState]=useState("todos"),[error,setError]=useState("");
  useEffect(()=>{listarTrabajadores().then(setItems).catch(e=>setError(e.message))},[]);
  const areas=[...new Set(items.map(w=>w.area_adscripcion))].sort();
  const rows=useMemo(()=>items.filter(w=>(area==="todas"||w.area_adscripcion===area)&&(state==="todos"||calcularEstado(w)===state)),[items,area,state]);
  return <>
    <PageHead title="Reportes de credencialización" description="Reporte general, por área y por estado de credencial, con impresión."><Button onClick={()=>window.print()}><Printer size={16} className="mr-2"/>Imprimir reporte</Button></PageHead>
    <ErrorMessage error={error}/>
    <div className="no-print mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2"><label className="field-label">Área de adscripción<select className="field" value={area} onChange={e=>setArea(e.target.value)}><option value="todas">Todas las áreas</option>{areas.map(a=><option key={a} value={a}>{a}</option>)}</select></label><label className="field-label">Estado<select className="field" value={state} onChange={e=>setState(e.target.value)}><option value="todos">Todos los estados</option><option value="vigente">Vigentes</option><option value="inactiva">Inactivas</option><option value="vencida">Vencidas</option><option value="no_vigente">No vigentes</option></select></label></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><ChartColumn size={19}/><h2 className="font-semibold">Reporte de credenciales</h2></div><strong className="text-sm">{rows.length} registros</strong></div><div className="overflow-x-auto"><table className="w-full min-w-[630px] text-left text-sm"><thead><tr className="border-y bg-slate-50 text-slate-500"><th className="p-3">Trabajador</th><th className="p-3">Núm. tarjeta</th><th className="p-3">Área</th><th className="p-3">Vencimiento</th><th className="p-3">Estado</th></tr></thead><tbody>{rows.map(w=><tr key={w.id} className="border-b border-slate-100"><td className="p-3">{w.nombre_completo}</td><td className="p-3">{w.numero_tarjeta}</td><td className="p-3">{w.area_adscripcion}</td><td className="p-3">{datePretty(w.fecha_vencimiento)}</td><td className="p-3"><Estado estado={calcularEstado(w)}/></td></tr>)}</tbody></table></div></section>
  </>;
}

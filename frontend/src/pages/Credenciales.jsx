import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "flowbite-react";
import { IdCard, Search, Eye, ToggleRight, ToggleLeft } from "lucide-react";
import { PageHead, Estado, ErrorMessage, Avatar } from "../components/Commons";
import { listarTrabajadores, cambiarEstado } from "../services/credenciales";
import { calcularEstado } from "../utils/estado";

export default function Credenciales() {
  const [workers,setWorkers]=useState([]), [query,setQuery]=useState(""), [state,setState]=useState("todos"), [error,setError]=useState(""), [updating,setUpdating]=useState(null);
  useEffect(()=>{listarTrabajadores().then(setWorkers).catch(e=>setError(e.message))},[]);
  const rows=useMemo(()=>workers.filter(w=> (state==="todos"||calcularEstado(w)===state) && `${w.nombre_completo} ${w.numero_tarjeta}`.toLowerCase().includes(query.toLowerCase())),[workers,query,state]);
  async function toggle(w) {
    setUpdating(w.id); setError("");
    try {
      const resultado = await cambiarEstado(w.id, !w.activa);
      setWorkers(prev => prev.map(x => x.id === w.id ? { ...x, activa: resultado.estado } : x));
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(null);
    }
  }
  return <>
    <PageHead title="Gestión de credenciales" description="Consulta vigencias y cambia el estado sin borrar al trabajador."/>
    <ErrorMessage error={error}/>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><span className="sr-only">Buscar</span><input className="field pl-10" placeholder="Nombre o número de tarjeta" value={query} onChange={e=>setQuery(e.target.value)}/></label><label><span className="sr-only">Estado</span><select className="field" value={state} onChange={e=>setState(e.target.value)}><option value="todos">Todos los estados</option><option value="vigente">Vigentes</option><option value="inactiva">Inactivas</option><option value="vencida">Vencidas</option><option value="no_vigente">No vigentes</option></select></label></div>
    <div className="grid gap-3">{rows.map(w=><article key={w.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center"><div className="flex min-w-0 items-center gap-3"><Avatar worker={w}/><div className="min-w-0"><div className="truncate font-semibold">{w.nombre_completo}</div><div className="text-xs text-slate-500">Tarjeta {w.numero_tarjeta} · {w.area_adscripcion}</div></div></div><div className="flex flex-wrap items-center gap-2"><Estado estado={calcularEstado(w)}/><Link to={`/admin/credenciales/${w.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-sky-700"><Eye size={16} className="mr-1 inline"/>Ver / imprimir</Link><button onClick={()=>toggle(w)} disabled={updating===w.id} title={w.activa ? "Desactivar credencial" : "Activar credencial"} className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-50 ${w.activa ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"}`}>{w.activa?<ToggleRight size={17}/>:<ToggleLeft size={17}/>}{updating===w.id ? "Actualizando…" : w.activa ? "Desactivar" : "Activar"}</button></div></article>)}</div>
    {!rows.length&&<div className="p-4 text-sm text-slate-500">No hay credenciales con esos filtros.</div>}</div>
  </>;
}

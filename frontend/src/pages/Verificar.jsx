import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ShieldCheck, ShieldX, CalendarDays, UserRoundCheck } from "lucide-react";
import { Estado, Avatar, PrivadoAviso } from "../components/Commons";
import { datePretty } from "../components/CredentialCard";
import { calcularEstado } from "../utils/estado";
import { verificarCredencial } from "../services/credenciales";

export default function Verificar() {
  const { token } = useParams();
  const [item,setItem]=useState(undefined),[error,setError]=useState("");
  useEffect(()=>{let active=true;setItem(undefined);verificarCredencial(token).then(v=>{if(active)setItem(v)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false};},[token]);
  const estado = item ? calcularEstado(item) : null;
  return <main className="min-h-screen bg-slate-100 px-4 py-9 sm:grid sm:place-items-center">
    <section className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="bg-slate-900 px-6 py-5 text-white"><div className="flex items-center gap-3"><ShieldCheck/><div><h1 className="text-xl font-bold">Verificación de credencial</h1><p className="text-sm text-slate-300">Consulta pública · Reto 3</p></div></div></div>
      <div className="p-6 sm:p-8">
        {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">No fue posible consultar la credencial: {error}</p>}
        {item===undefined&&!error&&<p className="text-slate-500">Consultando credencial…</p>}
        {item===null&&!error&&<div className="rounded-xl bg-red-50 p-5 text-red-800"><ShieldX className="mb-3" size={30}/><h2 className="text-xl font-bold">Credencial no encontrada</h2><p className="mt-2 text-sm">Este código QR no corresponde a una credencial registrada.</p></div>}
        {item&&<>
          <div className={`mb-5 rounded-xl p-4 ${estado==="vigente"?"bg-emerald-50 text-emerald-900":"bg-red-50 text-red-900"}`}><div className="mb-2 flex items-center gap-2"><UserRoundCheck size={19}/><strong>Estado actual</strong></div><Estado estado={estado}/>{estado!=="vigente"&&<p className="mt-2 text-sm font-semibold">Esta credencial NO es válida. Solicita una nueva al área administrativa.</p>}</div>
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5"><Avatar worker={item} size="lg"/><div><h2 className="text-xl font-bold">{item.nombre_completo}</h2><p className="text-sm text-slate-500">Trabajador {item.numero_trabajador}</p></div></div>
          <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">{[["Número de trabajador",item.numero_trabajador],["Área de adscripción",item.area_adscripcion],["Cargo",item.cargo],["Tarjeta",item.numero_tarjeta],["Inicio de vigencia",datePretty(item.fecha_inicio)],["Vencimiento",datePretty(item.fecha_vencimiento)]].map(([label,value])=><div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="font-semibold text-slate-900">{value}</dd></div>)}</dl>
          <PrivadoAviso/>
        </>}
      </div>
    </section>
  </main>;
}

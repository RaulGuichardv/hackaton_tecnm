import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "flowbite-react";
import { ArrowLeft, Printer, ExternalLink } from "lucide-react";
import CredentialCard, { datePretty } from "../components/CredentialCard";
import { ErrorMessage, PageHead, Estado } from "../components/Commons";
import { obtenerTrabajador } from "../services/credenciales";
import { calcularEstado } from "../utils/estado";

export default function DetalleCredencial() {
  const { id } = useParams(); const [worker,setWorker]=useState(null),[error,setError]=useState("");
  useEffect(()=>{obtenerTrabajador(id).then(setWorker).catch(e=>setError(e.message))},[id]);
  const link=(import.meta.env.VITE_PUBLIC_VERIFY_READY === "true" && worker?.token_verificacion) ? `/verificar/${encodeURIComponent(worker.token_verificacion)}` : null;
  return <>
    <PageHead title="Credencial digital" description="Vista de ambos lados e impresión horizontal. Medidas visuales sugeridas; confirmar especificaciones institucionales."><Link to="/admin/credenciales" className="text-sm text-sky-700"><ArrowLeft className="mr-1 inline" size={16}/>Volver</Link></PageHead>
    <ErrorMessage error={error}/>
    {worker?<><div className="no-print mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><strong>{worker.nombre_completo}</strong><Estado estado={calcularEstado(worker)}/><span className="text-xs text-slate-500">Vence {datePretty(worker.fecha_vencimiento)}</span><div className="flex-1"/><Button onClick={()=>window.print()}><Printer size={16} className="mr-2"/>Imprimir</Button>{link ? <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-sky-700">Abrir verificación <ExternalLink size={15}/></a> : <span className="text-xs text-amber-700">Verificación pública pendiente</span>}</div>
      
      <div className="no-print"><CredentialCard worker={worker}/><div className="mt-4 text-center text-xs text-slate-500">Anverso y reverso · impresión: aparecerán ambos lados</div></div>
      <div className="print-only"><CredentialCard worker={worker}/></div>
    </>:<p className="text-sm text-slate-500">Cargando credencial…</p>}
  </>;
}

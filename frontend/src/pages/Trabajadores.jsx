import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "flowbite-react";
import { Plus, Eye, Pencil } from "lucide-react";
import { Avatar, Estado, ErrorMessage, PageHead } from "../components/Commons";
import { calcularEstado } from "../utils/estado";
import { listarTrabajadores } from "../services/credenciales";

export default function Trabajadores() {
  const [workers, setWorkers] = useState([]), [search, setSearch] = useState(""), [error,setError] = useState(""), [loading,setLoading] = useState(true);
  useEffect(() => { let active=true; listarTrabajadores().then(v => { if(active) setWorkers(v); }).catch(e=> { if(active) setError(e.message); }).finally(()=> {if(active) setLoading(false); }); return()=>{active=false}; }, []);
  const filtered=useMemo(()=>workers.filter(w=>`${w.nombre_completo} ${w.numero_trabajador} ${w.area_adscripcion}`.toLowerCase().includes(search.toLowerCase())),[workers,search]);
  return <>
    <PageHead title="Trabajadores" description="Consulta los datos registrados y accede a su credencial. El reto exige al menos 10 registros."><Link to="/admin/trabajadores/nuevo"><Button><Plus size={17} className="mr-2"/>Registrar trabajador</Button></Link></PageHead>
    <ErrorMessage error={error}/>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><label className="w-full max-w-md"><span className="sr-only">Buscar trabajador</span><input className="field" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre, número o área…"/></label><span className="text-xs text-slate-500">{filtered.length} resultados</span></div>
      {loading ? <p className="py-6 text-sm">Cargando...</p> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Trabajador</th><th className="p-3">Número</th><th className="p-3">Área / cargo</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead><tbody>{filtered.map(w=><tr className="border-b border-slate-100" key={w.id}><td className="p-3"><div className="flex items-center gap-3"><Avatar worker={w}/><strong>{w.nombre_completo}</strong></div></td><td className="p-3">{w.numero_trabajador}</td><td className="p-3">{w.area_adscripcion}<div className="text-xs text-slate-500">{w.cargo}</div></td><td className="p-3"><Estado estado={calcularEstado(w)}/></td><td className="p-3"><div className="flex gap-3"><Link title="Ver credencial" to={`/admin/credenciales/${w.id}`} className="text-sky-700 hover:underline"><Eye size={18}/></Link><Link title="Editar trabajador" to={`/admin/trabajadores/${w.id}/editar`} className="text-slate-700 hover:underline"><Pencil size={18}/></Link></div></td></tr>)}</tbody></table></div>
        <div className="grid gap-3 md:hidden">{filtered.map(w=><article className="rounded-xl border border-slate-200 p-4" key={w.id}><div className="flex items-start gap-3"><Avatar worker={w}/><div className="min-w-0 flex-1"><strong className="block truncate">{w.nombre_completo}</strong><span className="text-xs text-slate-500">{w.numero_trabajador} · {w.area_adscripcion}</span><div className="mt-2"><Estado estado={calcularEstado(w)}/></div></div></div><div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-sm"><Link to={`/admin/credenciales/${w.id}`} className="text-sky-700">Ver credencial</Link><Link to={`/admin/trabajadores/${w.id}/editar`} className="text-sky-700">Editar</Link></div></article>)}</div>
        {!filtered.length && <p className="p-4 text-sm text-slate-500">No se encontraron trabajadores.</p>}
      </>}
    </div>
  </>;
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "flowbite-react";
import { ArrowLeft, Save } from "lucide-react";
import { Avatar, ErrorMessage, PageHead } from "../components/Commons";
import { guardarTrabajador, obtenerTrabajador } from "../services/credenciales";

const blank = { numero_trabajador:"", numero_tarjeta:"", nombre_completo:"", edad:"", sexo:"", curp:"", area_adscripcion:"", cargo:"", correo:"", emergencia_nombre:"", emergencia_telefono:"", fecha_inicio:"", fecha_vencimiento:"", foto:"", activa:true };
const fields = [
  ["nombre_completo", "Nombre completo", "text", true], ["edad", "Edad", "number", true],
  ["sexo", "Sexo", "select", true], ["curp", "CURP completa (privada)", "text", true],
  ["numero_trabajador", "Número de trabajador (pendiente backend)", "text", false], ["numero_tarjeta", "Número de tarjeta", "text", true],
  ["area_adscripcion", "Área de adscripción", "text", true], ["cargo", "Cargo", "text", true],
  ["emergencia_nombre", "Contacto de emergencia (privado)", "text", true], ["emergencia_telefono", "Teléfono de emergencia (privado)", "tel", true],
  ["correo", "Correo para notificaciones (pendiente backend)", "email", false], ["fecha_inicio", "Inicio de vigencia", "date", true],
  ["fecha_vencimiento", "Fin de vigencia", "date", true],
];
export default function TrabajadorForm() {
  const { id } = useParams(); const navigate=useNavigate();
  const [values,setValues] = useState(blank), [error,setError] = useState(""), [loading,setLoading] = useState(false);
  useEffect(()=>{ if(id) obtenerTrabajador(id).then(setValues).catch(e=>setError(e.message)); },[id]);
  function change(e) { setValues(v=>({...v,[e.target.name]:e.target.value})); }
  async function submit(e) {
    e.preventDefault(); setError("");
    if(values.fecha_inicio>values.fecha_vencimiento) {setError("La fecha de inicio debe ser anterior o igual al vencimiento");return;}
    if(!values.foto){setError("Incorpora una fotografía individual del trabajador");return;}
    setLoading(true);
    try { const result=await guardarTrabajador({...values, edad:Number(values.edad)},id); navigate(`/admin/credenciales/${result.id}`); }
    catch(ex){setError(ex.message)} finally {setLoading(false)}
  }
  return <>
    <PageHead title={id ? "Editar trabajador" : "Registrar trabajador"} description="Datos administrativos privados. Esta vista debe estar protegida por autenticación real cuando se integre FastAPI."><Link to="/admin/trabajadores" className="text-sm text-sky-700"><ArrowLeft size={16} className="mr-1 inline"/>Volver</Link></PageHead>
    <ErrorMessage error={error}/>
    <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">{fields.map(([name,label,type,required])=><label className="field-label" key={name}>{label}{type==="select" ? <select className="field" name={name} value={values[name]} onChange={change} required={required}><option value="">Selecciona una opción</option><option value="mujer">Mujer</option><option value="hombre">Hombre</option><option value="otros">Otro</option></select> : <input className="field" name={name} type={type} value={values[name]} onChange={change} disabled={["correo", "numero_trabajador"].includes(name) || (Boolean(id) && ["emergencia_nombre", "emergencia_telefono"].includes(name))} required={required && !["correo", "numero_trabajador"].includes(name)} min={type==="number" ? "1" : undefined} max={type==="number" ? "110" : undefined}/>}</label>)}</div>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[auto_1fr] sm:items-center"><Avatar worker={values} size="lg"/><label className="field-label">Ruta o URL de fotografía (provisional mientras se agrega la carga de archivos)<input className="field" name="foto" type="text" value={values.foto || ""} onChange={change} maxLength={255} placeholder="https://ejemplo.com/foto.jpg" required/></label></div>
      <p className="text-xs text-amber-800">Integración real: la API todavía NO permite subir archivos. Para probar el registro, escribe una URL o ruta de imagen existente (máx. 255 caracteres). Número de trabajador y correo no se guardan aún. Al editar, tampoco se guarda el contacto de emergencia. El token QR provisional no se puede verificar públicamente.</p>
      <div className="no-print flex flex-wrap justify-end gap-3"><Link to="/admin/trabajadores" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</Link><Button type="submit" disabled={loading}><Save size={16} className="mr-2"/>{loading?"Guardando…":"Guardar trabajador"}</Button></div>
    </form>
  </>;
}

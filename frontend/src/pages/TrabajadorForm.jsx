import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "flowbite-react";
import { ArrowLeft, Save } from "lucide-react";
import { Avatar, ErrorMessage, PageHead } from "../components/Commons";
import { guardarTrabajador, obtenerTrabajador, subirFotografia } from "../services/credenciales";

const blank = { nombre_completo:"", edad:"", sexo:"", curp:"", area_adscripcion:"", cargo:"", correo:"", emergencia_nombre:"", emergencia_telefono:"", fecha_inicio:"", fecha_vencimiento:"", foto:"", fotoFile:null, activa:true };
const fields = [
  ["nombre_completo", "Nombre completo", "text", true], ["edad", "Edad", "number", true],
  ["sexo", "Sexo", "select", true], ["curp", "CURP completa (18 caracteres, privada)", "text", true],
  ["area_adscripcion", "Área de adscripción", "text", true], ["cargo", "Cargo", "text", true],
  ["emergencia_nombre", "Contacto de emergencia (privado)", "text", true], ["emergencia_telefono", "Teléfono de emergencia (privado)", "tel", true],
  ["correo", "Correo para notificaciones", "email", true], ["fecha_inicio", "Inicio de vigencia", "date", true],
  ["fecha_vencimiento", "Fin de vigencia", "date", true],
];
export default function TrabajadorForm() {
  const { id } = useParams(); const navigate=useNavigate();
  const [values,setValues] = useState(blank), [error,setError] = useState(""), [loading,setLoading] = useState(false);
  useEffect(()=>{ if(id) obtenerTrabajador(id).then(setValues).catch(e=>setError(e.message)); },[id]);
  useEffect(() => () => {
    if (values.foto?.startsWith("blob:")) URL.revokeObjectURL(values.foto);
  }, [values.foto]);
  function change(e) { setValues(v=>({...v,[e.target.name]:e.target.value})); }
  function changePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen (JPG, PNG, WEBP o GIF).");
      e.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("La fotografía supera los 8 MB.");
      e.target.value = "";
      return;
    }
    setValues(v => ({ ...v, fotoFile: file, foto: URL.createObjectURL(file) }));
  }
  async function submit(e) {
    e.preventDefault(); setError("");
    if(values.fecha_inicio>values.fecha_vencimiento) {setError("La fecha de inicio debe ser anterior o igual al vencimiento");return;}
    if(!values.fotoFile && !values.foto){setError("Selecciona la fotografía del trabajador");return;}
    setLoading(true);
    try {
      let foto = values.foto;
      if (values.fotoFile) foto = await subirFotografia(values.fotoFile);
      const result = await guardarTrabajador({...values, foto, edad:Number(values.edad)}, id);
      navigate(`/admin/credenciales/${result.id}`);
    }
    catch(ex){setError(ex.message)} finally {setLoading(false)}
  }
  return <>
    <PageHead title={id ? "Editar trabajador" : "Registrar trabajador"} description="Datos administrativos privados. La vista y la API están protegidas con token de administrador."><Link to="/admin/trabajadores" className="text-sm text-sky-700"><ArrowLeft size={16} className="mr-1 inline"/>Volver</Link></PageHead>
    <ErrorMessage error={error}/>
    <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">{fields.map(([name,label,type,required])=><label className="field-label" key={name}>{label}{type==="select" ? <select className="field" name={name} value={values[name]} onChange={change} required={required}><option value="">Selecciona una opción</option><option value="mujer">Mujer</option><option value="hombre">Hombre</option><option value="otros">Otro</option></select> : <input className="field" name={name} type={type} value={values[name]} onChange={change} required={required} min={type==="number" ? "1" : undefined} max={type==="number" ? "110" : undefined} maxLength={name==="curp" ? 18 : name==="numero_tarjeta" ? 30 : undefined}/>}</label>)}</div>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[auto_1fr] sm:items-center"><Avatar worker={values} size="lg"/><div><label className="field-label" htmlFor="foto">Fotografía del trabajador<input id="foto" className="field" name="foto" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={changePhoto} required={!values.foto}/></label><p className="mt-1 text-xs text-slate-500">Se abre el explorador de archivos. Formatos JPG, PNG, WEBP o GIF · máximo 8 MB.</p></div></div>
      <div className="no-print flex flex-wrap justify-end gap-3"><Link to="/admin/trabajadores" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</Link><Button type="submit" disabled={loading}><Save size={16} className="mr-2"/>{loading?"Guardando…":"Guardar trabajador"}</Button></div>
    </form>
  </>;
}

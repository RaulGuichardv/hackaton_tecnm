import QRCode from "react-qr-code";
import { Avatar } from "./Commons";

export const datePretty = date => {
  if (!date) return "No registrada";
  const [y,m,d] = date.split("-");
  return `${d}/${m}/${y}`;
};

// Diseño horizontal para impresión. Las dimensiones 86 x 54 mm son una PROPUESTA,
// pues el documento solo exige horizontal, anverso y reverso.
export default function CredentialCard({ worker }) {
  if (!worker) return null;
  const url = worker.token_verificacion ? `${window.location.origin}/verify/${encodeURIComponent(worker.token_verificacion)}` : null;
  return <div className="grid items-start gap-5 xl:grid-cols-2">
    <article className="print-card relative aspect-[86/54] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-[6%] shadow-lg">
      <div className="absolute inset-x-0 top-0 h-[6%] bg-sky-800"/>
      <div className="flex items-center justify-between text-[clamp(9px,1.1vw,13px)] text-slate-500"><strong className="text-slate-900">TECNM</strong></div>
      <div className="mt-[8%] flex items-center gap-[5%]">
        <div className="w-[27%] shrink-0"><div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-100"><Avatar worker={worker} size="lg"/></div></div>
        <div className="min-w-0 flex-1"><div className="text-[clamp(13px,2vw,21px)] font-bold leading-tight text-slate-900">{worker.nombre_completo}</div><div className="mt-1 text-[clamp(10px,1.35vw,14px)] font-semibold text-sky-800">{worker.cargo}</div><div className="mt-2 text-[clamp(9px,1vw,12px)] text-slate-600">{worker.area_adscripcion}</div><div className="mt-2 text-[clamp(8px,.95vw,11px)] text-slate-600">Trabajador: {worker.numero_trabajador}</div></div>
      </div>
      <div className="absolute inset-x-[6%] bottom-[6%] border-t border-slate-200 pt-2 text-[clamp(8px,.8vw,10px)] text-slate-500">TECNM · Credencial de trabajador</div>
    </article>
    <article className="print-card relative aspect-[86/54] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-[6%] shadow-lg">
      <div className="absolute inset-x-0 top-0 h-[6%] bg-sky-800"/>
      <div className="flex h-full gap-[6%] items-center">
        <div className="shrink-0 rounded-md bg-white p-1" style={{width:"35%"}}>{url ? <QRCode value={url} size={180} style={{height:"auto",maxWidth:"100%",width:"100%"}}/> : <div className="grid min-h-28 place-items-center rounded border border-dashed p-3 text-center text-xs text-amber-700">QR pendiente de verificación pública</div>}</div>
        <div className="min-w-0 text-[clamp(9px,1vw,13px)] leading-relaxed text-slate-600"><strong className="text-slate-900">Verifica esta credencial</strong><p className="mt-2">Tarjeta: {worker.numero_tarjeta}</p><p>Vence: {datePretty(worker.fecha_vencimiento)}</p><p className="mt-2">Escanea el QR para comprobar su estado actualizado.</p><p className="mt-2 text-[clamp(8px,.85vw,11px)]">TECNM</p></div>
      </div>
    </article>
  </div>;
}

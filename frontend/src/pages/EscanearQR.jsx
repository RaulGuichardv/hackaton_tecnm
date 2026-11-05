import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import jsQR from "jsqr";
import { Camera, CameraOff, Keyboard, QrCode, ShieldCheck } from "lucide-react";
import { ErrorMessage, PageHead } from "../components/Commons";

function extraerToken(valor) {
  const raw = String(valor || "").trim();
  if (!raw) return "";

  const enQuery = raw.match(/[?&]token=([^&#]+)/);
  if (enQuery) return decodeURIComponent(enQuery[1]);

  const enRuta = raw.match(/\/veri(?:ficar|fy)\/([^/?#]+)/);
  if (enRuta) return decodeURIComponent(enRuta[1]);

  return raw;
}

export default function EscanearQR() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  const [estado, setEstado] = useState("idle");
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");

  function detenerCamara(actualizarEstado = true) {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (actualizarEstado) setEstado("idle");
  }

  useEffect(() => () => detenerCamara(false), []);

  function abrirCredencial(valor) {
    const token = extraerToken(valor);
    if (!token) {
      setError("El código QR no contiene un identificador válido.");
      return;
    }
    navigate(`/verify/${encodeURIComponent(token)}`);
  }

  function escanearFotograma() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const contexto = canvas.getContext("2d", { willReadFrequently: true });
      contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imagen = contexto.getImageData(0, 0, canvas.width, canvas.height);
      const codigo = jsQR(imagen.data, imagen.width, imagen.height, {
        inversionAttempts: "dontInvert",
      });

      if (codigo?.data) {
        detenerCamara(false);
        abrirCredencial(codigo.data);
        return;
      }
    }

    frameRef.current = requestAnimationFrame(escanearFotograma);
  }

  async function iniciarCamara() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado("error");
      setError("Este navegador no permite abrir la cámara aquí. La cámara requiere HTTPS o ejecutarse en localhost.");
      return;
    }

    detenerCamara(false);
    setEstado("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setEstado("scanning");
      frameRef.current = requestAnimationFrame(escanearFotograma);
    } catch (err) {
      detenerCamara(false);
      setEstado("error");
      if (err?.name === "NotAllowedError") {
        setError("Permiso de cámara denegado. Habilita el acceso a la cámara en el navegador e inténtalo de nuevo.");
      } else if (err?.name === "NotFoundError") {
        setError("No se encontró una cámara disponible en este dispositivo.");
      } else {
        setError(`No se pudo iniciar la cámara: ${err?.message || err}`);
      }
    }
  }

  function enviarManual(event) {
    event.preventDefault();
    setError("");
    abrirCredencial(manual);
  }

  return <>
    <PageHead title="Escanear código QR" description="Abre la cámara y apunta al código QR de una credencial. Al detectarlo se mostrará la página de verificación del trabajador.">
      <Link to="/admin/trabajadores" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Volver a trabajadores</Link>
    </PageHead>

    <ErrorMessage error={error}/>

    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-sky-700"/>
            <h2 className="font-semibold">Cámara del dispositivo</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${estado === "scanning" ? "bg-emerald-50 text-emerald-800" : estado === "error" ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-600"}`}>
            {estado === "scanning" ? "Buscando QR…" : estado === "starting" ? "Abriendo cámara…" : estado === "error" ? "Cámara no disponible" : "Cámara apagada"}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-slate-900">
          <video ref={videoRef} muted playsInline autoPlay className={`aspect-video w-full object-cover ${estado === "scanning" ? "" : "hidden"}`}/>
          <canvas ref={canvasRef} className="hidden"/>
          {estado !== "scanning" && <div className="grid aspect-video place-content-center gap-3 p-6 text-center text-slate-300">
            <Camera size={42} className="mx-auto text-sky-400"/>
            <p className="text-sm">La imagen de la cámara aparecerá aquí.</p>
          </div>}
          {estado === "scanning" && <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-52 w-52 rounded-2xl border-2 border-sky-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]"/></div>}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {estado !== "scanning" ? (
            <button type="button" onClick={iniciarCamara} disabled={estado === "starting"} className="flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 disabled:opacity-50">
              <Camera size={17}/>{estado === "starting" ? "Abriendo…" : "Encender cámara"}
            </button>
          ) : (
            <button type="button" onClick={() => detenerCamara()} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
              <CameraOff size={17}/>Apagar cámara
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">La cámara solo se activa cuando presionas el botón. Si el dispositivo no tiene cámara, usa el código manual.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2"><Keyboard size={19} className="text-sky-700"/><h2 className="font-semibold">Código manual</h2></div>
        <form onSubmit={enviarManual} className="grid gap-3">
          <label className="field-label">Token o URL de la credencial
            <input className="field" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Ej. 5f0c2e... o https://…/verify/…" required/>
          </label>
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">Abrir credencial</button>
        </form>
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-900">
          <ShieldCheck size={17} className="mt-0.5 shrink-0"/>
          <p>La página de verificación consulta el QR en la base de datos y muestra el estado actual de la credencial del trabajador.</p>
        </div>
      </section>
    </div>
  </>;
}

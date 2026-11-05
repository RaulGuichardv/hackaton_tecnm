import { apiFetch } from "./api";
import { ENDPOINTS } from "./endpoints";

// Adaptación al backend FastAPI.
// Las rutas administrativas exigen un Bearer token firmado por el backend.
const auth = () => ({ token: sessionStorage.getItem("token") });
const field = (value) => (value == null ? "" : String(value));
const dateField = (value) => field(value).slice(0, 10);
const rejectMissing = (value, name) => {
  if (!field(value).trim()) throw new Error(`Completa el campo: ${name}`);
};

function fotoUrl(value) {
  const url = field(value).trim();
  if (!url) return "";
  // Las rutas HTTP absolutas, relativas a la web y data URLs existentes se muestran
  // solo como vista previa. La API actual no expone archivos de imagen.
  return url;
}

function normalizar(row, extra = {}) {
  if (!row || typeof row !== "object") throw new Error("Respuesta de trabajador inesperada");
  return {
    id: row.id_trabajador ?? row.id,
    nombre_completo: row.nombre_completo ?? "",
    edad: row.edad ?? "",
    sexo: row.sexo ?? "",
    curp: row.curp ?? "", // Solo en vistas de administración, NO en verificación pública.
    numero_tarjeta: field(row.numero_de_tarjeta ?? row.numero_tarjeta),
    numero_trabajador: row.numero_trabajador ?? "",
    area_adscripcion: row.area_adscripcion ?? "",
    cargo: row.cargo ?? "",
    foto: fotoUrl(row.fotografia ?? row.foto),
    correo: row.correo ?? "",
    emergencia_nombre: extra.emergencia?.nombre ?? "",
    emergencia_telefono: extra.emergencia?.telefono ?? "",
    fecha_inicio: dateField(extra.vigencia?.fecha_inicio),
    fecha_vencimiento: dateField(extra.vigencia?.fecha_vencimiento),
    activa: typeof extra.estado?.estado === "boolean" ? extra.estado.estado : null,
    token_verificacion: extra.qr?.qr ?? undefined,
    relaciones_incompletas: extra.errores?.length > 0,
  };
}

// Promise.allSettled permite mostrar la tabla aunque falle una relación.
// Nunca inventamos que una credencial está vigente si no recibimos su estado.
async function cargarRelaciones(id, conEmergencia = false) {
  const requests = [
    ["estado", ENDPOINTS.estado(id)],
    ["vigencia", ENDPOINTS.vigencias(id)],
    ["qr", ENDPOINTS.qr(id)],
    ...(conEmergencia ? [["emergencia", ENDPOINTS.emergencia(id)]] : []),
  ];
  const results = await Promise.allSettled(
    requests.map(([, url]) => apiFetch(url, auth()))
  );
  const extra = { errores: [] };
  results.forEach((result, index) => {
    const [key] = requests[index];
    if (result.status === "fulfilled") extra[key] = result.value;
    else extra.errores.push(key);
  });
  return extra;
}

export async function listarTrabajadores() {
  const data = await apiFetch(ENDPOINTS.listar, auth());
  if (!Array.isArray(data)) throw new Error("FastAPI no devolvió una lista de trabajadores");
  // Para la demo: 3 peticiones extra por trabajador para completar fechas, estado y QR.
  // Para producción conviene que FastAPI entregue un DTO agregado y paginado.
  const result = [];
  for (let i = 0; i < data.length; i += 4) {
    const batch = await Promise.all(
      data.slice(i, i + 4).map(async (row) => {
        const extra = await cargarRelaciones(row.id_trabajador);
        return normalizar(row, extra);
      })
    );
    result.push(...batch);
  }
  return result;
}

export async function obtenerTrabajador(id) {
  const row = await apiFetch(ENDPOINTS.consultar(id), auth());
  const extra = await cargarRelaciones(id, true);
  return normalizar(row, extra);
}

const fechaHora = (fecha, fin = false) => {
  rejectMissing(fecha, "fecha de vigencia");
  return `${dateField(fecha)}T${fin ? "23:59:59" : "00:00:00"}`;
};

function validarFormulario(w) {
  for (const k of ["nombre_completo", "sexo", "curp", "numero_trabajador", "numero_tarjeta", "area_adscripcion", "cargo", "correo", "foto", "fecha_inicio", "fecha_vencimiento"]) {
    rejectMissing(w[k], k);
  }
  const curp = field(w.curp).trim().toUpperCase();
  if (!/^[A-Z0-9]{18}$/.test(curp)) {
    throw new Error("La CURP debe tener exactamente 18 caracteres alfanuméricos");
  }
  const correo = field(w.correo).trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    throw new Error("El correo electrónico no es válido");
  }
  const num = field(w.numero_tarjeta).trim();
  if (!/^\d{4,30}$/.test(num)) {
    throw new Error("Número de tarjeta: escribe entre 4 y 30 dígitos (puede iniciar con ceros)");
  }
  if (!Number.isInteger(Number(w.edad)) || Number(w.edad) < 1 || Number(w.edad) > 110) {
    throw new Error("Edad no válida");
  }
  if (!["hombre", "mujer", "otros"].includes(w.sexo)) {
    throw new Error("Elige un sexo que acepte FastAPI: hombre, mujer u otros");
  }
  if (dateField(w.fecha_inicio) > dateField(w.fecha_vencimiento)) {
    throw new Error("La fecha inicial no puede ser posterior a la final");
  }
  if (field(w.foto).startsWith("data:")) {
    throw new Error("El backend no acepta imágenes Base64. Usa el selector de archivos para subir la fotografía.");
  }
  if (field(w.foto).length > 255) {
    throw new Error("La ruta de fotografía supera los 255 caracteres admitidos en MariaDB");
  }
  return num;
}

/**
 * REGISTRO: el backend exige fotografia (VARCHAR), qr y relaciones anidadas.
 * El UUID de verificación se genera en el navegador y el backend lo valida
 * como único. La vista pública consulta el estado actual sin regenerar el QR.
 */
export async function guardarTrabajador(values, id) {
  const numero_de_tarjeta = validarFormulario(values);
  const generales = {
    nombre_completo: values.nombre_completo.trim(),
    edad: Number(values.edad),
    sexo: values.sexo,
    curp: values.curp.trim().toUpperCase(),
    numero_trabajador: values.numero_trabajador.trim(),
    numero_de_tarjeta,
    area_adscripcion: values.area_adscripcion.trim(),
    cargo: values.cargo.trim(),
    correo: values.correo.trim().toLowerCase(),
    fotografia: values.foto.trim(),
  };

  if (!id) {
    rejectMissing(values.emergencia_nombre, "contacto de emergencia");
    rejectMissing(values.emergencia_telefono, "teléfono de emergencia");
    const nuevo = {
      ...generales,
      datos_emergencia: {
        nombre: values.emergencia_nombre.trim(),
        telefono: values.emergencia_telefono.trim(),
      },
      vigencia: {
        fecha_inicio: fechaHora(values.fecha_inicio),
        fecha_vencimiento: fechaHora(values.fecha_vencimiento, true),
      },
      qr: { qr: crypto.randomUUID() },
    };
    const result = await apiFetch(ENDPOINTS.registrar, {
      ...auth(), method: "POST", body: nuevo,
    });
    return { id: result.id_trabajador, ...result };
  }

  // FastAPI expone dos operaciones independientes; si falla una de ellas,
  // la otra puede ya haberse guardado. Informar en vez de simular atomicidad.
  await apiFetch(ENDPOINTS.actualizar(id), {
    ...auth(), method: "PATCH", body: generales,
  });
  try {
    await apiFetch(ENDPOINTS.actualizarVigencia(id), {
      ...auth(), method: "PUT",
      body: {
        fecha_inicio: fechaHora(values.fecha_inicio),
        fecha_vencimiento: fechaHora(values.fecha_vencimiento, true),
      },
    });
  } catch (e) {
    throw new Error(`Se actualizaron datos generales, pero la vigencia falló: ${e.message}`);
  }
  // No existe endpoint para editar contactos de emergencia.
  return { id: Number(id) };
}

export async function cambiarEstado(id, activa) {
  return apiFetch(ENDPOINTS.estado(id), {
    ...auth(),
    method: "PATCH",
    body: { estado: Boolean(activa) },
  });
}

export async function subirFotografia(file) {
  if (!file) throw new Error("Selecciona una fotografía");
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen");
  if (file.size > 8 * 1024 * 1024) throw new Error("La fotografía supera los 8 MB");

  const formData = new FormData();
  formData.append("archivo", file);
  const resultado = await apiFetch(ENDPOINTS.subirFotografia, {
    ...auth(),
    method: "POST",
    body: formData,
  });

  if (!resultado?.url) throw new Error("El servidor no devolvió la ruta de la fotografía");
  return resultado.url;
}

export async function verificarCredencial(token) {
  if (!token) return null;
  try {
    const row = await apiFetch(ENDPOINTS.verificar(token));
    if (!row) return null;
    return {
      id: row.id_trabajador,
      nombre_completo: row.nombre_completo,
      numero_tarjeta: field(row.numero_de_tarjeta),
      numero_trabajador: row.numero_trabajador ?? "",
      area_adscripcion: row.area_adscripcion,
      cargo: row.cargo,
      foto: fotoUrl(row.fotografia),
      fecha_inicio: dateField(row.fecha_inicio),
      fecha_vencimiento: dateField(row.fecha_vencimiento),
      activa:
        Boolean(row.estado) &&
        Boolean(row.credencial_activa_dentro_del_periodo) &&
        !Boolean(row.credencial_desactivada_por_el_administrador),
    };
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

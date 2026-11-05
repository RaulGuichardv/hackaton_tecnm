// Estado de credencial para presentación. El backend debe ser la fuente de verdad.
const aBooleano = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const texto = value.trim().toLowerCase();
    if (["1", "true", "si", "sí", "yes"].includes(texto)) return true;
    if (["0", "false", "no"].includes(texto)) return false;
  }
  return null;
};

export function calcularEstado(worker) {
  if (worker?.estado && ["vigente", "vencida", "inactiva", "no_vigente"].includes(worker.estado)) {
    return worker.estado;
  }
  const activa = aBooleano(worker?.activa);
  if (activa === false) return "inactiva";
  const now = new Date();
  const hoy = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const inicio = worker?.fecha_inicio?.slice(0, 10);
  const fin = worker?.fecha_vencimiento?.slice(0, 10);
  if (activa === null || !inicio || !fin) return "sin_datos";
  if (fin && hoy > fin) return "vencida";
  if (inicio && hoy < inicio) return "no_vigente";
  return inicio && fin ? "vigente" : "no_vigente";
}

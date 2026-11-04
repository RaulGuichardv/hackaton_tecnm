// Rutas informadas por el backend del equipo. Aún confirmar respuesta JSON en Swagger.
export const ENDPOINTS = {
  registrar: "/trabajadores/registrar",
  listar: "/trabajadores/consultar-todo",
  consultar: id => `/trabajadores/consultar/${encodeURIComponent(id)}`,
  estado: id => `/trabajadores/${encodeURIComponent(id)}/estado`,
  emergencia: id => `/trabajadores/${encodeURIComponent(id)}/datos-emergencia`,
  vigencias: id => `/trabajadores/${encodeURIComponent(id)}/vigencias`,
  qr: id => `/trabajadores/${encodeURIComponent(id)}/qr`,
  actualizar: id => `/trabajadores/actualizar/${encodeURIComponent(id)}`,
  actualizarVigencia: id => `/trabajadores/${encodeURIComponent(id)}/vigencia`,
  eliminar: id => `/trabajadores/eliminar/${encodeURIComponent(id)}`,
};

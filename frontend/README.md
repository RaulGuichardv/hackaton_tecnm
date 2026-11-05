# Credetec — Frontend React para FastAPI

Este proyecto contiene **solo el frontend** del hackatón. Debe estar al mismo nivel que el directorio `backend/` ya compartido por el compañero, no dentro de él.

**Comienza aquí:** [README principal](../README.md). Incluye base de datos, variables de entorno, autenticación, notificaciones y puesta en marcha completa.

## Prueba rápida

Terminal 1 desde `hackaton_tecnm/backend` con entorno Python activado:

```bash
python -m uvicorn main:app --reload
```

Terminal 2 desde `hackaton_tecnm/frontend`:

```bash
cp .env.example .env
npm install
npm run dev
```

Abrir en desarrollo: `http://localhost:5173/dev/conexion`. Presionar **Probar conexión** para probar OpenAPI y el GET de trabajadores, sin mostrar datos personales.

## Estado de la integración

- Servicios HTTP conectados a las rutas de trabajadores, credenciales, carga de fotografías y verificación pública por QR.
- Autenticación administrativa real: el login entrega un token firmado con expiración y FastAPI lo exige en todas las operaciones administrativas. La verificación pública permanece abierta.
- El formulario abre el explorador de archivos para subir la fotografía y el backend la guarda en `backend/uploads/fotos`.
- El número de trabajador, el correo y el número de tarjeta (texto de 4 a 30 dígitos) se guardan y validan como únicos.
- Vista pública en `/verify/{token}` (o por número de tarjeta): muestra fotografía, nombre, número de trabajador, área, cargo, tarjeta, vigencia y estado. No expone CURP ni contactos de emergencia.
- Módulo `/admin/escanear` con cámara para leer QR y entrada manual; al detectar un código abre la vista pública de la credencial.
- Cambio manual de estado (activar/desactivar) desde la vista de credenciales, reflejado de inmediato en la verificación pública.
- Notificaciones automáticas al crear una credencial, activarla/desactivarla y modificar la vigencia. Si no hay SMTP configurado, los correos quedan en `backend/outbox/*.eml` para revisión local.
- `base_de_datos/db.sql` crea 10 trabajadores de demostración; `seed_trabajadores.sql` agrega los faltantes en una base existente y `generar_fotos_demo.sh` genera sus fotografías de ejemplo.

**La API ya valida el token administrativo.** Para producción aún se recomienda configurar HTTPS, una clave `CREDETEC_SECRET_KEY` propia, SMTP real y respaldo de la base de datos.

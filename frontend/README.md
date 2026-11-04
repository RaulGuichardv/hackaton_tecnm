# Credetec — Frontend React para FastAPI

Este proyecto contiene **solo el frontend** del hackatón. Debe estar al mismo nivel que el directorio `backend/` ya compartido por el compañero, no dentro de él.

**Comienza aquí:** [PASOS_CONEXION_FASTAPI.md](PASOS_CONEXION_FASTAPI.md). Incluye estructura, dos terminales, pruebas, correspondencia JSON y pendientes.

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

- Servicios HTTP conectados a las 10 rutas disponibles; la ruta DELETE no se emplea.
- El formulario se adaptó a `numero_de_tarjeta`, `fotografia`, `datos_emergencia`, `vigencia` y `qr` del schema real.
- Las vistas administrativas permanecen protegidas por login, **pendiente de implementar realmente en FastAPI**. No hay autenticación falsa.
- La verificación pública por QR y el cambio de estado siguen pendientes de endpoints del backend.
- No contiene registros ficticios y no incluye contraseñas ni scripts SQL.

**No usar con datos reales ni publicar el backend actual sin autenticación/autorización**; devuelve CURP y operaciones administrativas sin control de acceso.

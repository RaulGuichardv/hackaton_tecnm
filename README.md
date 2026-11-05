# Credetec — Sistema de Credencialización Web (Reto 3)

Sistema full-stack para administrar trabajadores, generar credenciales digitales imprimibles y verificar su vigencia mediante un código QR público.

## Tecnologías

- **Backend:** FastAPI, PyMySQL, MariaDB/MySQL, bcrypt, SMTP.
- **Frontend:** React + Vite, Tailwind CSS, Flowbite React, `react-qr-code`, `jsqr`.
- **Autenticación:** token firmado HMAC-SHA256 con expiración (12 h por defecto).
- **Notificaciones:** correo SMTP con respaldo local en `backend/outbox/*.eml`.

## Puesta en marcha

### 1. Base de datos

```bash
cd /home/raulgv/hackaton_tecnm
mysql -u root -p < base_de_datos/db.sql
```

`db.sql` crea el esquema, el administrador de demostración y **10 trabajadores** de ejemplo.

Si ya tienes una base creada antes de estos cambios, aplica las migraciones:

```bash
mysql -u root -p < base_de_datos/migracion_fotos_qr.sql
mysql -u root -p < base_de_datos/migracion_tarjeta_varchar.sql
mysql -u root -p < base_de_datos/seed_trabajadores.sql
./base_de_datos/generar_fotos_demo.sh   # opcional: fotos de ejemplo con ImageMagick
```

### 2. Variables de entorno

```bash
cp .env.example .env
# Edita DB_PASSWORD, CREDETEC_SECRET_KEY y, si tienes SMTP, los datos SMTP_*
```

Si no configuras SMTP, cada notificación se guarda como archivo `.eml` en `backend/outbox/` para poder revisarla localmente.

### 3. Backend

```bash
source env/bin/activate
cd backend
uvicorn main:app --reload
```

- API: `http://127.0.0.1:8000`
- Documentación: `http://127.0.0.1:8000/docs`

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Aplicación: `http://localhost:5173`

## Acceso de demostración

- Correo: `admin@credetec.com`
- Contraseña: `Admin1234!`

Cambia esta contraseña y la clave `CREDETEC_SECRET_KEY` antes de desplegar.

## Funcionalidad principal

- **Trabajadores:** alta, edición, fotografía desde el explorador de archivos, CURP validada, número de trabajador y número de tarjeta únicos.
- **Credencial horizontal:** anverso y reverso, fotografía, datos laborales, QR, tarjeta, vencimiento e impresión.
- **Verificación pública:** `/verify/{token}` o `/verify/{numero_tarjeta}`; muestra el estado dinámico y no expone CURP ni contactos de emergencia.
- **Escáner QR:** `/admin/escanear` usa la cámara del dispositivo con `jsqr` y navega a la credencial detectada.
- **Estados:** Vigente, Inactiva, Vencida y No vigente, calculados con las fechas y la activación administrativa.
- **Reportes:** general, por área de adscripción y por estado, con impresión.
- **Notificaciones:** creación de credencial, activación/desactivación y modificación de vigencia.
- **Seguridad:** todas las rutas administrativas exigen `Authorization: Bearer <token>`; solo el login y la verificación pública quedan abiertos.

## Endpoints

La lista completa está en `backend/endpoints.txt`. Los principales:

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/administrador/login` | No | Inicia sesión y entrega token |
| GET | `/administrador/perfil` | Sí | Datos del administrador autenticado |
| GET | `/trabajadores/consultar-todo` | Sí | Lista de trabajadores |
| POST | `/trabajadores/registrar` | Sí | Registra trabajador y relaciones |
| PATCH | `/trabajadores/actualizar/{id}` | Sí | Actualización parcial |
| PATCH | `/trabajadores/{id}/estado` | Sí | Activa/desactiva credencial |
| PUT | `/trabajadores/{id}/vigencia` | Sí | Modifica vigencia |
| POST | `/uploads/fotografias` | Sí | Sube fotografía |
| GET | `/verificar?token=...` | No | Verificación pública por token o tarjeta |

## Pruebas rápidas

```bash
# Sin token debe responder 401
curl -i http://127.0.0.1:8000/trabajadores/consultar-todo

# Login
curl -X POST http://127.0.0.1:8000/administrador/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@credetec.com","password":"Admin1234!"}'

# Verificación pública
curl 'http://127.0.0.1:8000/verificar?token=dd5885fc-d8a6-11f1-9c9c-84c8a0516652'
```

## Notas para producción

- Configura HTTPS, una `CREDETEC_SECRET_KEY` aleatoria y un SMTP real.
- Restringe CORS a los dominios del frontend (actualmente `*` para desarrollo).
- Respalda la base de datos y las fotografías de `backend/uploads/`.
- El límite de subida es de 8 MB por fotografía.

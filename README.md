# Credetec — Sistema de Credencialización Web

Sistema para administrar trabajadores, generar credenciales digitales y verificar su vigencia mediante QR.

## 1. Base de datos

Se crea el esquema, el administrador y 10 trabajadores de ejemplo:

```bash
cd /home/raulgv/hackaton_tecnm
mysql -u root -p credetec < base_de_datos/db.sql
```

## 2. Variables de entorno

Se copian las variables de ejemplo y se editan según sea necesario:

```bash
cp .env.example .env
```

## 3. Backend (FastAPI)

El backend se ejecuta con uvicorn:

```bash
source env/bin/activate
cd backend
uvicorn main:app --reload
```

- API: `http://127.0.0.1:8000`
- Documentación: `http://127.0.0.1:8000/docs`

## 4. Frontend (React + Vite)

El frontend se compila y ejecuta en modo desarrollo:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Aplicación: `http://localhost:5173`

## Acceso de administrador

- Correo: `admin@credetec.com`
- Contraseña: `Admin1234!`

## Fotografías

Las imágenes se guardan en MariaDB (tabla `fotografias`) y se sirven en `/fotos/{id}`. Así sobreviven a los despliegues y reinicios de Render Free, cuyo disco es efímero. En producción, `VITE_API_URL` debe ser la URL absoluta del backend para que el navegador cargue las fotos desde Render y no desde Vercel.

## Notificaciones por correo

El sistema envía un correo a la dirección registrada del trabajador cuando se crea, se actualiza o cambia el estado de su credencial. Si la dirección no existe, el proveedor rechazará o rebotará el mensaje; registra correos reales para probar el flujo.

- En local o en un plan pagado de Render se puede usar SMTP (Gmail) configurando `SMTP_*`.
- **Render Free bloquea los puertos SMTP 25, 465 y 587.** En producción configura un proveedor por HTTPS (puerto 443) y verifica el remitente en el proveedor:
  - `BREVO_API_KEY` + `EMAIL_API_FROM`
  - `SENDGRID_API_KEY` + `EMAIL_API_FROM`
  - `RESEND_API_KEY` + `EMAIL_API_FROM`

El backend elige automáticamente el primer proveedor HTTP configurado; si no hay ninguno, usa SMTP o guarda el correo en `backend/outbox`.

Diagnóstico con token de administrador:

- `GET /test/correo-config`: indica el proveedor activo sin exponer secretos.
- `POST /test/notificacion?correo=...`: envía un correo de prueba y devuelve el resultado real.


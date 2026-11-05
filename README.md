# Credetec — Sistema de Credencialización Web

Sistema para administrar trabajadores, generar credenciales digitales y verificar su vigencia mediante QR.

## 1. Base de datos

```bash
cd /home/raulgv/hackaton_tecnm
mysql -u root -p credetec < base_de_datos/db.sql
```

Crea el esquema, el administrador y 10 trabajadores de ejemplo.

## 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` si necesitas cambiar la contraseña de la base de datos o configurar SMTP para los correos.

## 3. Backend (FastAPI)

```bash
source env/bin/activate
cd backend
uvicorn main:app --reload
```

- API: `http://127.0.0.1:8000`
- Documentación: `http://127.0.0.1:8000/docs`

## 4. Frontend (React + Vite)

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

## Rutas principales

- `/login` — Inicio de sesión
- `/admin` — Panel general
- `/admin/trabajadores` — Lista de trabajadores
- `/admin/trabajadores/nuevo` — Registrar trabajador (con foto)
- `/admin/credenciales` — Ver credenciales y activar/desactivar
- `/admin/escanear` — Escáner de cámara para QR
- `/admin/reportes` — Reportes de credencialización
- `/verify/{token}` — Verificación pública de credencial

## Notas

- Las fotografías se suben desde el explorador de archivos y se guardan en `backend/uploads/fotos/`.
- Si no configuras SMTP, los correos de notificación se guardan como `.eml` en `backend/outbox/`.
- Para producción, cambia la contraseña del admin y configura `CREDETEC_SECRET_KEY` en `.env`.

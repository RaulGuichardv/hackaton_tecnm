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

## Acceso de demostración

- Correo: `admin@credetec.com`
- Contraseña: `Admin1234!`

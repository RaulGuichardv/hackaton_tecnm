from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
from pathlib import Path
from uuid import uuid4
import re
import traceback

import controllers
import notificaciones
from auth import crear_token, requiere_admin

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
FOTOS_DIR = UPLOADS_DIR / "fotos"
FOTOS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Credetec API",
    description="API RESTful para la gestión de trabajadores, credenciales y relaciones en MariaDB.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def preparar_tabla_fotografias():
    """Garantiza el almacenamiento persistente de fotografías en MariaDB."""
    try:
        controllers.asegurar_tabla_fotografias()
    except Exception as error:
        print(f"No se pudo preparar la tabla de fotografías: {error}")


class SexoEnum(str, Enum):
    hombre = "hombre"
    mujer = "mujer"
    otros = "otros"

PATRON_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def validar_curp(valor):
    if valor is None:
        return valor
    valor = valor.strip().upper()
    if len(valor) != 18 or not valor.isalnum():
        raise ValueError("La CURP debe tener exactamente 18 caracteres alfanuméricos")
    return valor

def validar_correo(valor):
    if valor is None:
        return valor
    valor = valor.strip().lower()
    if not PATRON_CORREO.fullmatch(valor):
        raise ValueError("El correo electrónico no es válido")
    return valor

def validar_numero_trabajador(valor):
    if valor is None:
        return valor
    valor = valor.strip()
    if not valor:
        raise ValueError("El número de trabajador es obligatorio")
    return valor

def validar_numero_tarjeta(valor):
    if valor is None:
        return valor
    valor = str(valor).strip()
    if not valor.isdigit():
        raise ValueError("El número de tarjeta debe contener únicamente dígitos")
    if len(valor) < 4 or len(valor) > 30:
        raise ValueError("El número de tarjeta debe tener entre 4 y 30 dígitos")
    return valor

class AdminLoginSchema(BaseModel):
    correo: str
    password: str

class AdminCreateSchema(BaseModel):
    nombre: str
    correo: str
    password: str

class DatosEmergenciaSchema(BaseModel):
    nombre: str
    telefono: str

class VigenciaSchema(BaseModel):
    fecha_inicio: datetime
    fecha_vencimiento: datetime

class EstadoSchema(BaseModel):
    estado: bool = True

class CredencialTrabajadorResponse(BaseModel):
    fotografia: str
    nombre_completo: str
    id_trabajador: int
    area_adscripcion: str
    cargo: str
    numero_de_tarjeta: str
    fecha_vencimiento: datetime
    estado: bool

class VerificacionCredencialSchema(BaseModel):
    id_trabajador: int
    nombre_completo: str
    numero_trabajador: str
    numero_de_tarjeta: str
    area_adscripcion: str
    cargo: str
    fotografia: str
    fecha_inicio: datetime
    fecha_vencimiento: datetime
    estado: bool
    credencial_activa_dentro_del_periodo: bool
    credencial_desactivada_por_el_administrador: bool

class ArchivoSubidoSchema(BaseModel):
    url: str

class QRSchema(BaseModel):
    qr: str

class RegistrarTrabajadorSchema(BaseModel):
    nombre_completo: str
    edad: int
    sexo: SexoEnum
    curp: str
    numero_trabajador: Optional[str] = None
    numero_de_tarjeta: Optional[str] = None
    area_adscripcion: str
    cargo: str
    correo: str
    fotografia: str
    datos_emergencia: DatosEmergenciaSchema
    vigencia: VigenciaSchema
    qr: QRSchema

    @field_validator("curp")
    @classmethod
    def _validar_curp(cls, valor):
        return validar_curp(valor)

    @field_validator("correo")
    @classmethod
    def _validar_correo(cls, valor):
        return validar_correo(valor)

    @field_validator("numero_trabajador")
    @classmethod
    def _validar_numero_trabajador(cls, valor):
        return validar_numero_trabajador(valor)

    @field_validator("numero_de_tarjeta")
    @classmethod
    def _validar_numero_tarjeta(cls, valor):
        return validar_numero_tarjeta(valor)

class ActualizarTrabajadorSchema(BaseModel):
    nombre_completo: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[SexoEnum] = None
    curp: Optional[str] = None
    numero_trabajador: Optional[str] = None
    numero_de_tarjeta: Optional[str] = None
    area_adscripcion: Optional[str] = None
    cargo: Optional[str] = None
    correo: Optional[str] = None
    fotografia: Optional[str] = None

    @field_validator("curp")
    @classmethod
    def _validar_curp(cls, valor):
        return validar_curp(valor)

    @field_validator("correo")
    @classmethod
    def _validar_correo(cls, valor):
        return validar_correo(valor)

    @field_validator("numero_trabajador")
    @classmethod
    def _validar_numero_trabajador(cls, valor):
        return validar_numero_trabajador(valor)

    @field_validator("numero_de_tarjeta")
    @classmethod
    def _validar_numero_tarjeta(cls, valor):
        return validar_numero_tarjeta(valor)

class TrabajadorResponseSchema(BaseModel):
    id_trabajador: int
    nombre_completo: str
    edad: int
    sexo: SexoEnum
    curp: str
    numero_trabajador: str
    numero_de_tarjeta: str
    area_adscripcion: str
    cargo: str
    correo: str
    fotografia: str
    id_datos_emergencia: int
    id_vigencia: int
    id_estado: int
    id_qr: int
    estado: Optional[bool] = None
    estado_activo: Optional[bool] = None
    fecha_inicio: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    qr: Optional[str] = None


class TrabajadoresPaginadosResponse(BaseModel):
    resultados: List[TrabajadorResponseSchema]
    total: int
    pagina: int
    pagina_tamano: int
    total_paginas: int

@app.post(
    "/trabajadores/registrar",
    status_code=status.HTTP_201_CREATED,
    tags=["Trabajadores"],
    dependencies=[Depends(requiere_admin)],
)
def registrar_trabajador(trabajador: RegistrarTrabajadorSchema, background_tasks: BackgroundTasks):
    try:
        resultado = controllers.registrar_trabajador_completo(trabajador.model_dump())
        try:
            datos = controllers.obtener_datos_notificacion(resultado["id_trabajador"])
            if datos:
                background_tasks.add_task(notificaciones.enviar_notificacion, "creacion", datos)
        except Exception as error:
            print(f"No se pudo preparar la notificación de creación: {error}")
        return resultado
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/trabajadores/consultar-todo",
    response_model=TrabajadoresPaginadosResponse,
    tags=["Trabajadores"],
    dependencies=[Depends(requiere_admin)],
)
def consultar_todos(page: int = 1, page_size: int = 50):
    try:
        return controllers.obtener_todos_los_trabajadores(page=page, page_size=page_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/trabajadores/consultar/{id_trabajador}",
    response_model=TrabajadorResponseSchema,
    tags=["Trabajadores"],
    dependencies=[Depends(requiere_admin)],
)
def consultar_trabajador(id_trabajador: int):
    trabajador = controllers.obtener_trabajador_por_id(id_trabajador)
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    return trabajador

@app.get(
    "/trabajadores/{id_trabajador}/estado",
    response_model=EstadoSchema,
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)
def obtener_estado(id_trabajador: int):
    estado = controllers.obtener_estado_trabajador(id_trabajador)
    if not estado:
        raise HTTPException(status_code=404, detail="Estado del trabajador no encontrado")
    return estado

@app.patch(
    "/trabajadores/{id_trabajador}/estado",
    response_model=EstadoSchema,
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)
def actualizar_estado(id_trabajador: int, datos: EstadoSchema, background_tasks: BackgroundTasks):
    resultado = controllers.actualizar_estado_trabajador(id_trabajador, datos.estado)
    if not resultado:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    datos_notificacion = controllers.obtener_datos_notificacion(id_trabajador)
    if datos_notificacion:
        tipo = "activacion" if datos.estado else "desactivacion"
        background_tasks.add_task(notificaciones.enviar_notificacion, tipo, datos_notificacion)
    return resultado

@app.get(
    "/trabajadores/{id_trabajador}/datos-emergencia",
    response_model=DatosEmergenciaSchema,
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)
def obtener_datos_emergencia(id_trabajador: int):
    datos = controllers.obtener_datos_emergencia_trabajador(id_trabajador)
    if not datos:
        raise HTTPException(status_code=404, detail="Datos de emergencia no encontrados")
    return datos

@app.patch(
    "/trabajadores/{id_trabajador}/datos-emergencia",
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)
def actualizar_datos_emergencia(
    id_trabajador: int,
    datos: DatosEmergenciaSchema,
    background_tasks: BackgroundTasks,
):
    if not controllers.obtener_trabajador_por_id(id_trabajador):
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    try:
        resultado = controllers.actualizar_datos_emergencia_trabajador(
            id_trabajador, datos.model_dump()
        )
        if not resultado:
            raise HTTPException(status_code=404, detail="Datos de emergencia no encontrados")
        datos_notificacion = controllers.obtener_datos_notificacion(id_trabajador)
        if datos_notificacion:
            background_tasks.add_task(
                notificaciones.enviar_notificacion, "modificacion", datos_notificacion
            )
        return resultado
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))

@app.get(
    "/trabajadores/{id_trabajador}/vigencias",
    response_model=VigenciaSchema,
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)
def obtener_vigencia(id_trabajador: int):
    vigencia = controllers.obtener_vigencia_trabajador(id_trabajador)
    if not vigencia:
        raise HTTPException(status_code=404, detail="Vigencia no encontrada")
    return vigencia

@app.get(
    "/trabajadores/{id_trabajador}/qr",
    response_model=QRSchema,
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)
def obtener_qr(id_trabajador: int):
    qr = controllers.obtener_qr_trabajador(id_trabajador)
    if not qr:
        raise HTTPException(status_code=404, detail="QR no encontrado")
    return qr

@app.get(
    "/trabajadores/{id_trabajador}/credenciales",
    response_model=CredencialTrabajadorResponse,
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)
def obtener_credenciales_de_un_empleado(id_trabajador: int):
    credenciales = controllers.obtener_credenciales_de_un_trabajador(id_trabajador)
    if not credenciales:
        raise HTTPException(status_code=404, detail="credenciales no encontradas")
    return credenciales

@app.patch(
    "/trabajadores/actualizar/{id_trabajador}",
    tags=["Trabajadores"],
    dependencies=[Depends(requiere_admin)],
)
def actualizar_trabajador(id_trabajador: int, datos: ActualizarTrabajadorSchema, background_tasks: BackgroundTasks):
    datos_dict = datos.model_dump(exclude_unset=True)
    if not datos_dict:
        raise HTTPException(status_code=400, detail="Debes proporcionar al menos un campo para actualizar")
    if not controllers.obtener_trabajador_por_id(id_trabajador):
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    try:
        resultado = controllers.actualizar_trabajador_parcial(id_trabajador, datos_dict)
        datos_notificacion = controllers.obtener_datos_notificacion(id_trabajador)
        if datos_notificacion:
            background_tasks.add_task(notificaciones.enviar_notificacion, "modificacion", datos_notificacion)
        return resultado
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))

@app.put(
    "/trabajadores/{id_trabajador}/vigencia",
    response_model=VigenciaSchema,
    tags=["Relaciones"],
    dependencies=[Depends(requiere_admin)],
)

def actualizar_vigencia(
    id_trabajador: int,
    vigencia: VigenciaSchema,
    background_tasks: BackgroundTasks,
):
    resultado = controllers.actualizar_vigencia_trabajador(
        id_trabajador,
        vigencia.fecha_inicio.strftime('%Y-%m-%d %H:%M:%S'),
        vigencia.fecha_vencimiento.strftime('%Y-%m-%d %H:%M:%S')
    )
    if not resultado:
        raise HTTPException(status_code=404, detail="Trabajador o vigencia no encontrada")
    datos_notificacion = controllers.obtener_datos_notificacion(id_trabajador)
    if datos_notificacion:
        background_tasks.add_task(
            notificaciones.enviar_notificacion,
            "modificacion_vigencia",
            datos_notificacion,
        )
    return resultado

@app.get(
    "/trabajadores/test-lista",
    tags=["Pruebas"],
    summary="Endpoint de diagnóstico de la lista de trabajadores",
    dependencies=[Depends(requiere_admin)],
)
def test_lista_trabajadores():
    """Devuelve información diagnóstica sobre la respuesta de trabajadores sin requerir autenticación."""
    try:
        datos = controllers.obtener_todos_los_trabajadores(page=1, page_size=5)
        return {
            "ok": True,
            "tipo_respuesta": type(datos).__name__,
            "tiene_resultados": isinstance(datos, dict) and "resultados" in datos,
            "resultado_es_lista": isinstance(datos.get("resultados"), list) if isinstance(datos, dict) else isinstance(datos, list),
            "total": datos.get("total") if isinstance(datos, dict) else None,
            "ejemplo_primer_registro": datos["resultados"][0] if isinstance(datos, dict) and datos.get("resultados") else None,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}



@app.delete(
    "/trabajadores/eliminar/{id_trabajador}",
    tags=["Trabajadores"],
    dependencies=[Depends(requiere_admin)],
)
def eliminar_trabajador(id_trabajador: int):
    resultado = controllers.eliminar_trabajador_por_id(id_trabajador)
    if not resultado:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    return resultado


@app.get(
    "/test/correo-config",
    tags=["Pruebas"],
    dependencies=[Depends(requiere_admin)],
)
def test_correo_config():
    """Muestra qué proveedor de correo está configurado, sin exponer secretos."""
    return notificaciones.diagnostico()


@app.post(
    "/test/notificacion",
    tags=["Pruebas"],
    dependencies=[Depends(requiere_admin)],
)
def test_notificacion(correo: str):
    """Envía un correo de prueba y devuelve el resultado real del envío."""
    resultado = notificaciones.enviar_notificacion("creacion", {
        "nombre_completo": "Prueba SMTP",
        "numero_trabajador": "TRAB-9999",
        "numero_de_tarjeta": "1234567890123456",
        "area_adscripcion": "Sistemas",
        "cargo": "Desarrollador",
        "correo": correo,
        "fecha_inicio": "2026-01-01",
        "fecha_vencimiento": "2026-12-31",
        "estado": True,
        "credencial_activa_dentro_del_periodo": True,
        "credencial_desactivada_por_el_administrador": False,
        "qr": "prueba-smtp-123",
    })
    return resultado


@app.post("/administrador/login", status_code=status.HTTP_200_OK, tags=["Administrador"])
def login_admin(credenciales: AdminLoginSchema):
    resultado = controllers.autenticar_administrador(credenciales.correo, credenciales.password)

    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )

    token, expira_en = crear_token(resultado)
    return {
        "mensaje": "Inicio de sesión exitoso",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": expira_en,
        "administrador": {
            "id_administrador": resultado["id_administrador"],
            "nombre": resultado.get("nombre", ""),
            "correo": resultado["correo"]
        }
    }

@app.get("/administrador/perfil", tags=["Administrador"])
def perfil_admin(admin: dict = Depends(requiere_admin)):
    return {
        "id_administrador": admin.get("sub"),
        "nombre": admin.get("nombre", ""),
        "correo": admin.get("correo", ""),
    }

@app.post(
    "/administrador/registrar",
    status_code=status.HTTP_201_CREATED,
    tags=["Administrador"],
    dependencies=[Depends(requiere_admin)],
)
def registrar_administrador(admin: AdminCreateSchema):
    try:
        resultado = controllers.crear_administrador(admin.nombre, admin.correo, admin.password)
        return resultado
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar administrador: {str(e)}"
        )

TAMANIO_MAXIMO_FOTO = 8 * 1024 * 1024  # 8 MB
EXTENSIONES_FOTO = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

@app.post(
    "/uploads/fotografias",
    response_model=ArchivoSubidoSchema,
    status_code=status.HTTP_201_CREATED,
    tags=["Archivos"],
    dependencies=[Depends(requiere_admin)],
)
async def subir_fotografia(archivo: UploadFile = File(...)):
    extension = EXTENSIONES_FOTO.get((archivo.content_type or "").lower())
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato no permitido. Usa JPG, PNG, WEBP o GIF."
        )

    contenido = await archivo.read(TAMANIO_MAXIMO_FOTO + 1)
    if not contenido:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío")
    if len(contenido) > TAMANIO_MAXIMO_FOTO:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="La fotografía supera los 8 MB")

    # La imagen se guarda en MariaDB (no en el disco de Render) para que
    # sobreviva a despliegues y reinicios del servicio.
    id_fotografia = uuid4().hex
    try:
        controllers.guardar_fotografia(id_fotografia, archivo.content_type, contenido)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo guardar la fotografía: {e}",
        )

    return {"url": f"/fotos/{id_fotografia}"}


@app.get("/fotos/{id_fotografia}", tags=["Archivos"])
def mostrar_fotografia(id_fotografia: str):
    """Entrega una fotografía almacenada en MariaDB."""
    fila = controllers.obtener_fotografia(id_fotografia)
    if not fila:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fotografía no encontrada")
    return Response(
        content=fila["contenido"],
        media_type=fila["tipo"],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@app.get("/verificar", response_model=VerificacionCredencialSchema, tags=["Verificación pública"])
def verificar_credencial_publica(token: str):
    resultado = controllers.obtener_credencial_por_qr(token)
    if not resultado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial no encontrada")
    return resultado


# El montaje de archivos estáticos va al final para no interceptar /uploads/fotografias (POST).
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

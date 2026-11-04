from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

import controllers

app = FastAPI(
    title="Credetec API",
    description="API RESTful para la gestión de trabajadores, credenciales y relaciones en MariaDB.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SexoEnum(str, Enum):
    hombre = "hombre"
    mujer = "mujer"
    otros = "otros"

class DatosEmergenciaSchema(BaseModel):
    nombre: str
    telefono: str

class VigenciaSchema(BaseModel):
    fecha_inicio: datetime
    fecha_vencimiento: datetime

class EstadoSchema(BaseModel):
    estado: bool = True

class QRSchema(BaseModel):
    qr: str

class RegistrarTrabajadorSchema(BaseModel):
    nombre_completo: str
    edad: int
    sexo: SexoEnum
    curp: str
    numero_de_tarjeta: int
    area_adscripcion: str
    cargo: str
    fotografia: str
    datos_emergencia: DatosEmergenciaSchema
    vigencia: VigenciaSchema
    qr: QRSchema

class ActualizarTrabajadorSchema(BaseModel):
    nombre_completo: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[SexoEnum] = None
    curp: Optional[str] = None
    numero_de_tarjeta: Optional[int] = None
    area_adscripcion: Optional[str] = None
    cargo: Optional[str] = None
    fotografia: Optional[str] = None

class TrabajadorResponseSchema(BaseModel):
    id_trabajador: int
    nombre_completo: str
    edad: int
    sexo: SexoEnum
    curp: str
    numero_de_tarjeta: int
    area_adscripcion: str
    cargo: str
    fotografia: str
    id_datos_emergencia: int
    id_vigencia: int
    id_estado: int
    id_qr: int

@app.post("/trabajadores/registrar", status_code=status.HTTP_201_CREATED, tags=["Trabajadores"])
def registrar_trabajador(trabajador: RegistrarTrabajadorSchema):
    try:
        resultado = controllers.registrar_trabajador_completo(trabajador.dict())
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trabajadores/consultar-todo", response_model=List[TrabajadorResponseSchema], tags=["Trabajadores"])
def consultar_todos():
    try:
        return controllers.obtener_todos_los_trabajadores()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trabajadores/consultar/{id_trabajador}", response_model=TrabajadorResponseSchema, tags=["Trabajadores"])
def consultar_trabajador(id_trabajador: int):
    trabajador = controllers.obtener_trabajador_por_id(id_trabajador)
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    return trabajador

@app.get("/trabajadores/{id_trabajador}/estado", response_model=EstadoSchema, tags=["Relaciones"])
def obtener_estado(id_trabajador: int):
    estado = controllers.obtener_estado_trabajador(id_trabajador)
    if not estado:
        raise HTTPException(status_code=404, detail="Estado del trabajador no encontrado")
    return estado

@app.get("/trabajadores/{id_trabajador}/datos-emergencia", response_model=DatosEmergenciaSchema, tags=["Relaciones"])
def obtener_datos_emergencia(id_trabajador: int):
    datos = controllers.obtener_datos_emergencia_trabajador(id_trabajador)
    if not datos:
        raise HTTPException(status_code=404, detail="Datos de emergencia no encontrados")
    return datos

@app.get("/trabajadores/{id_trabajador}/vigencias", response_model=VigenciaSchema, tags=["Relaciones"])
def obtener_vigencia(id_trabajador: int):
    vigencia = controllers.obtener_vigencia_trabajador(id_trabajador)
    if not vigencia:
        raise HTTPException(status_code=404, detail="Vigencia no encontrada")
    return vigencia

@app.get("/trabajadores/{id_trabajador}/qr", response_model=QRSchema, tags=["Relaciones"])
def obtener_qr(id_trabajador: int):
    qr = controllers.obtener_qr_trabajador(id_trabajador)
    if not qr:
        raise HTTPException(status_code=404, detail="QR no encontrado")
    return qr

@app.patch("/trabajadores/actualizar/{id_trabajador}", tags=["Trabajadores"])
def actualizar_trabajador(id_trabajador: int, datos: ActualizarTrabajadorSchema):
    datos_dict = datos.dict(exclude_unset=True)
    if not datos_dict:
        raise HTTPException(status_code=400, detail="Debes proporcionar al menos un campo para actualizar")
    if not controllers.obtener_trabajador_por_id(id_trabajador):
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    return controllers.actualizar_trabajador_parcial(id_trabajador, datos_dict)

@app.put("/trabajadores/{id_trabajador}/vigencia", response_model=VigenciaSchema, tags=["Relaciones"])
def actualizar_vigencia(id_trabajador: int, vigencia: VigenciaSchema):
    resultado = controllers.actualizar_vigencia_trabajador(
        id_trabajador, 
        vigencia.fecha_inicio.strftime('%Y-%m-%d %H:%M:%S'), 
        vigencia.fecha_vencimiento.strftime('%Y-%m-%d %H:%M:%S')
    )
    if not resultado:
        raise HTTPException(status_code=404, detail="Trabajador o vigencia no encontrada")
    return resultado

@app.delete("/trabajadores/eliminar/{id_trabajador}", tags=["Trabajadores"])
def eliminar_trabajador(id_trabajador: int):
    resultado = controllers.eliminar_trabajador_por_id(id_trabajador)
    if not resultado:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    return resultado
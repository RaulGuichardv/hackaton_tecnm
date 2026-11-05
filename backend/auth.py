"""Autenticación administrativa basada en tokens firmados (JWT HS256).

No se agregan dependencias externas: el token se firma con HMAC-SHA256 usando
la biblioteca estándar. Configura CREDETEC_SECRET_KEY en producción.
"""
import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

SECRET_KEY = os.getenv("CREDETEC_SECRET_KEY", "credetec-dev-secret-cambiar-en-produccion")
TOKEN_TTL_SECONDS = int(os.getenv("CREDETEC_TOKEN_TTL", "43200"))  # 12 horas
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _credenciales_invalidas(detalle: str = "Token de administrador inválido") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detalle,
        headers={"WWW-Authenticate": "Bearer"},
    )


def crear_token(admin: dict) -> tuple[str, int]:
    """Devuelve (token, segundos_de_vigencia) para un administrador autenticado."""
    emitido = int(time.time())
    payload = {
        "sub": admin["id_administrador"],
        "correo": admin["correo"],
        "nombre": admin.get("nombre", ""),
        "iat": emitido,
        "exp": emitido + TOKEN_TTL_SECONDS,
    }
    header = {"alg": ALGORITHM, "typ": "JWT"}
    partes = [
        _b64encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
        _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
    ]
    firma = hmac.new(
        SECRET_KEY.encode("utf-8"),
        ".".join(partes).encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{partes[0]}.{partes[1]}.{_b64encode(firma)}", TOKEN_TTL_SECONDS


def decodificar_token(token: str) -> dict:
    try:
        header_b64, payload_b64, firma_b64 = token.split(".")
    except ValueError:
        raise _credenciales_invalidas()

    firma_esperada = hmac.new(
        SECRET_KEY.encode("utf-8"),
        f"{header_b64}.{payload_b64}".encode("ascii"),
        hashlib.sha256,
    ).digest()
    try:
        firma_recibida = _b64decode(firma_b64)
        payload = json.loads(_b64decode(payload_b64))
    except Exception:
        raise _credenciales_invalidas()

    if not hmac.compare_digest(firma_esperada, firma_recibida):
        raise _credenciales_invalidas()

    if int(payload.get("exp", 0)) < int(time.time()):
        raise _credenciales_invalidas("La sesión expiró. Inicia sesión de nuevo.")

    return payload


def requiere_admin(
    credenciales: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Dependencia de FastAPI: exige un Bearer token administrativo válido."""
    if credenciales is None or credenciales.scheme.lower() != "bearer":
        raise _credenciales_invalidas("Token de administrador requerido")
    return decodificar_token(credenciales.credentials)

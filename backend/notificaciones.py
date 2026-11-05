"""Notificaciones automáticas por correo para el sistema de credencialización.

Si SMTP_HOST no está configurado, el correo se escribe como archivo .eml en
backend/outbox para que el flujo sea verificable en desarrollo sin credenciales.
El envío nunca interrumpe la operación principal: los errores se registran.
"""
import logging
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from html import escape
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("credetec.notificaciones")

BASE_DIR = Path(__file__).resolve().parent
OUTBOX_DIR = BASE_DIR / "outbox"

SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@credetec.com").strip()
SMTP_SSL = os.getenv("SMTP_SSL", "false").lower() in {"1", "true", "yes", "si", "sí"}
SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "true").lower() in {"1", "true", "yes", "si", "sí"}
SMTP_TIMEOUT = int(os.getenv("SMTP_TIMEOUT", "10"))
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:5173").rstrip("/")

TIPOS = {
    "creacion": (
        "Creación de nueva credencial",
        "Se registró una nueva credencial para el trabajador.",
    ),
    "desactivacion": (
        "Credencial desactivada",
        "El administrador desactivó la credencial.",
    ),
    "activacion": (
        "Credencial reactivada",
        "El administrador reactivó la credencial.",
    ),
    "modificacion": (
        "Modificación de datos del trabajador",
        "El administrador modificó datos de la credencial (nombre, área, cargo o número de tarjeta).",
    ),
    "modificacion_vigencia": (
        "Modificación de vigencia",
        "El administrador modificó las fechas de vigencia de la credencial.",
    ),
}


def _fecha(valor) -> str:
    if isinstance(valor, datetime):
        return valor.strftime("%d/%m/%Y")
    if valor:
        return str(valor)[:10]
    return "No registrada"


def _bool(valor) -> bool:
    return bool(valor)


def calcular_estado_actual(datos: dict) -> str:
    """Calcula el estado visible de la credencial con las reglas del Reto 3."""
    if not _bool(datos.get("estado")):
        return "Inactiva"
    if _bool(datos.get("credencial_desactivada_por_el_administrador")):
        return "Inactiva"
    if not _bool(datos.get("credencial_activa_dentro_del_periodo", True)):
        return "No vigente"

    ahora = datetime.now()
    inicio = datos.get("fecha_inicio")
    fin = datos.get("fecha_vencimiento")
    if isinstance(ahora, datetime):
        if isinstance(fin, datetime) and ahora > fin:
            return "Vencida"
        if isinstance(inicio, datetime) and ahora < inicio:
            return "No vigente"
    return "Vigente"


def _construir_mensaje(tipo: str, datos: dict) -> EmailMessage:
    titulo, motivo = TIPOS.get(tipo, (tipo, "Actualización de credencial."))
    estado = calcular_estado_actual(datos)
    inicio = _fecha(datos.get("fecha_inicio"))
    fin = _fecha(datos.get("fecha_vencimiento"))
    nombre = datos.get("nombre_completo", "Trabajador")
    numero_trabajador = datos.get("numero_trabajador", "")
    numero_tarjeta = datos.get("numero_de_tarjeta", "")
    area = datos.get("area_adscripcion", "")
    cargo = datos.get("cargo", "")
    qr = datos.get("qr")
    url = f"{PUBLIC_BASE_URL}/verify/{qr}" if qr else PUBLIC_BASE_URL
    nombre_html = escape(str(nombre))
    trabajador_html = escape(str(numero_trabajador))
    tarjeta_html = escape(str(numero_tarjeta))
    area_html = escape(str(area))
    cargo_html = escape(str(cargo))
    url_html = escape(str(url), quote=True)

    mensaje = EmailMessage()
    mensaje["Subject"] = f"[Credetec] {titulo} - {nombre}"
    mensaje["From"] = SMTP_FROM
    mensaje["To"] = datos.get("correo", "")
    mensaje.set_content(
        "\n".join(
            [
                "Sistema de credencialización Credetec",
                "",
                f"Tipo de notificación: {titulo}",
                f"Nombre del trabajador: {nombre}",
                f"Número de trabajador: {numero_trabajador}",
                f"Número de tarjeta: {numero_tarjeta}",
                f"Área de adscripción: {area}",
                f"Cargo: {cargo}",
                f"Vigencia: {inicio} al {fin}",
                f"Estado actualizado: {estado}",
                "",
                motivo,
                f"Verificación pública: {url}",
                "",
                "Este mensaje se generó automáticamente. No respondas a este correo.",
            ]
        )
    )
    mensaje.add_alternative(
        f"""<!doctype html>
<html lang="es">
<body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#075985;color:#ffffff;padding:20px 24px;font-size:20px;font-weight:bold">Credetec · Credencialización</td></tr>
        <tr><td style="padding:24px">
          <h1 style="margin:0 0 16px;font-size:20px">{titulo}</h1>
          <p style="margin:0 0 16px;color:#475569">{motivo}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse;font-size:14px">
            <tr><td style="color:#64748b">Trabajador</td><td style="font-weight:bold">{nombre_html}</td></tr>
            <tr><td style="color:#64748b">Número de trabajador</td><td>{trabajador_html}</td></tr>
            <tr><td style="color:#64748b">Número de tarjeta</td><td>{tarjeta_html}</td></tr>
            <tr><td style="color:#64748b">Área</td><td>{area_html}</td></tr>
            <tr><td style="color:#64748b">Cargo</td><td>{cargo_html}</td></tr>
            <tr><td style="color:#64748b">Vigencia</td><td>{inicio} al {fin}</td></tr>
            <tr><td style="color:#64748b">Estado actualizado</td><td style="font-weight:bold;color:#0369a1">{estado}</td></tr>
          </table>
          <p style="margin:20px 0 0"><a href="{url_html}" style="display:inline-block;background:#0369a1;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none">Verificar credencial</a></p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px">Este mensaje se generó automáticamente. No respondas a este correo.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>""",
        subtype="html",
    )
    return mensaje


def _enviar_smtp(mensaje: EmailMessage) -> None:
    if SMTP_SSL:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT) as smtp:
            if SMTP_USER:
                smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(mensaje)
        return

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT) as smtp:
        smtp.ehlo()
        if SMTP_STARTTLS:
            smtp.starttls()
            smtp.ehlo()
        if SMTP_USER:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(mensaje)


def _guardar_en_outbox(mensaje: EmailMessage, tipo: str, datos: dict) -> Path:
    OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
    marca = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    destino = OUTBOX_DIR / f"{marca}-{tipo}-trabajador-{datos.get('id_trabajador', 'x')}.eml"
    destino.write_bytes(bytes(mensaje))
    return destino


def enviar_notificacion(tipo: str, datos: dict) -> None:
    """Envía (o guarda en outbox) la notificación. Nunca lanza excepciones."""
    destinatario = (datos.get("correo") or "").strip()
    if not destinatario:
        logger.warning("No se envió la notificación %s: el trabajador no tiene correo", tipo)
        return

    try:
        mensaje = _construir_mensaje(tipo, datos)
        if not SMTP_HOST:
            destino = _guardar_en_outbox(mensaje, tipo, datos)
            logger.info("SMTP no configurado; correo guardado en %s", destino)
            return
        _enviar_smtp(mensaje)
        logger.info("Notificación %s enviada a %s", tipo, destinatario)
    except Exception as error:  # El correo nunca debe tumbar la operación principal.
        logger.error("No se pudo enviar la notificación %s a %s: %s", tipo, destinatario, error)

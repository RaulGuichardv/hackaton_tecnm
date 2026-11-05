"""Notificaciones automáticas por correo para el sistema de credencialización.

Si SMTP_HOST no está configurado, el correo se escribe como archivo .eml en
backend/outbox para que el flujo sea verificable en desarrollo sin credenciales.
El envío nunca interrumpe la operación principal: los errores se registran.
"""
import json
import logging
import os
import smtplib
import urllib.request
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
# Las contraseñas de aplicación de Gmail se muestran con espacios; el servidor
# espera los 16 caracteres sin separadores.
SMTP_PASSWORD = "".join(os.getenv("SMTP_PASSWORD", "").split())
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@credetec.com").strip()
SMTP_SSL = os.getenv("SMTP_SSL", "false").lower() in {"1", "true", "yes", "si", "sí"}
SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "true").lower() in {"1", "true", "yes", "si", "sí"}
SMTP_TIMEOUT = int(os.getenv("SMTP_TIMEOUT", "10"))
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:5173").rstrip("/")

# Proveedores de correo por HTTPS (puerto 443). Render Free bloquea los puertos
# SMTP 25, 465 y 587, por lo que en producción se debe usar una API HTTP.
EMAIL_API_FROM = os.getenv("EMAIL_API_FROM", SMTP_FROM).strip()
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "").strip()
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()

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
    """Calcula el estado visible de la credencial con las reglas del sistema."""
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


def _cuerpos_html_texto(mensaje: EmailMessage) -> tuple[str, str]:
    """Extrae las versiones texto y HTML del mensaje para las APIs HTTP."""
    parte_texto = mensaje.get_body(preferencelist=("plain",))
    parte_html = mensaje.get_body(preferencelist=("html",))
    texto = parte_texto.get_content() if parte_texto else ""
    html = parte_html.get_content() if parte_html else ""
    return texto, html


def _post_json(url: str, payload: dict, headers: dict) -> None:
    datos = json.dumps(payload).encode("utf-8")
    solicitud = urllib.request.Request(
        url,
        data=datos,
        method="POST",
        headers={"Content-Type": "application/json", **headers},
    )
    with urllib.request.urlopen(solicitud, timeout=SMTP_TIMEOUT) as respuesta:
        if respuesta.status >= 300:
            raise RuntimeError(f"El proveedor respondió HTTP {respuesta.status}")


def _enviar_brevo(mensaje: EmailMessage, destinatario: str) -> None:
    texto, html = _cuerpos_html_texto(mensaje)
    _post_json(
        "https://api.brevo.com/v3/smtp/email",
        {
            "sender": {"name": "Credetec", "email": EMAIL_API_FROM},
            "to": [{"email": destinatario}],
            "subject": mensaje["Subject"],
            "htmlContent": html,
            "textContent": texto,
        },
        {"api-key": BREVO_API_KEY, "accept": "application/json"},
    )


def _enviar_sendgrid(mensaje: EmailMessage, destinatario: str) -> None:
    texto, html = _cuerpos_html_texto(mensaje)
    _post_json(
        "https://api.sendgrid.com/v3/mail/send",
        {
            "personalizations": [{"to": [{"email": destinatario}]}],
            "from": {"email": EMAIL_API_FROM},
            "subject": mensaje["Subject"],
            "content": [
                {"type": "text/plain", "value": texto},
                {"type": "text/html", "value": html},
            ],
        },
        {"Authorization": f"Bearer {SENDGRID_API_KEY}"},
    )


def _enviar_resend(mensaje: EmailMessage, destinatario: str) -> None:
    texto, html = _cuerpos_html_texto(mensaje)
    _post_json(
        "https://api.resend.com/emails",
        {
            "from": EMAIL_API_FROM,
            "to": [destinatario],
            "subject": mensaje["Subject"],
            "html": html,
            "text": texto,
        },
        {"Authorization": f"Bearer {RESEND_API_KEY}"},
    )


def _proveedor_http():
    if BREVO_API_KEY:
        return "brevo", _enviar_brevo
    if SENDGRID_API_KEY:
        return "sendgrid", _enviar_sendgrid
    if RESEND_API_KEY:
        return "resend", _enviar_resend
    return None, None


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


def diagnostico() -> dict:
    """Estado de configuración del correo sin exponer credenciales."""
    proveedor, _ = _proveedor_http()
    return {
        "proveedor_http": proveedor,
        "smtp_configurado": bool(SMTP_HOST),
        "smtp_host": SMTP_HOST or None,
        "smtp_port": SMTP_PORT if SMTP_HOST else None,
        "smtp_usuario": SMTP_USER or None,
        "remitente": EMAIL_API_FROM or None,
    }


def enviar_notificacion(tipo: str, datos: dict) -> dict:
    """Envía (o guarda en outbox) la notificación. Nunca lanza excepciones.

    Devuelve un diccionario con el resultado para que los diagnósticos puedan
    informar si el correo salió realmente.
    """
    destinatario = (datos.get("correo") or "").strip()
    if not destinatario:
        logger.warning("No se envió la notificación %s: el trabajador no tiene correo", tipo)
        return {"ok": False, "error": "El trabajador no tiene correo registrado."}

    try:
        mensaje = _construir_mensaje(tipo, datos)
        proveedor, enviar_http = _proveedor_http()
        if proveedor:
            enviar_http(mensaje, destinatario)
            logger.info("Notificación %s enviada a %s vía %s", tipo, destinatario, proveedor)
            return {"ok": True, "proveedor": proveedor, "destinatario": destinatario}

        if not SMTP_HOST:
            destino = _guardar_en_outbox(mensaje, tipo, datos)
            logger.info("SMTP no configurado; correo guardado en %s", destino)
            return {
                "ok": True,
                "proveedor": "outbox",
                "destinatario": destinatario,
                "archivo": str(destino),
            }

        _enviar_smtp(mensaje)
        logger.info("Notificación %s enviada a %s vía SMTP", tipo, destinatario)
        return {"ok": True, "proveedor": "smtp", "destinatario": destinatario}
    except Exception as error:  # El correo nunca debe tumbar la operación principal.
        logger.error(
            "No se pudo enviar la notificación %s a %s: %s", tipo, destinatario, error,
            exc_info=True,
        )
        return {
            "ok": False,
            "destinatario": destinatario,
            "error": f"{type(error).__name__}: {error}",
        }

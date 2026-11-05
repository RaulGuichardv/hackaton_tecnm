from conn import obtener_conexion
import pymysql

from datetime import datetime
import bcrypt

def registrar_trabajador_completo(datos: dict) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT id_trabajador FROM trabajadores WHERE numero_de_tarjeta = %s",
                (datos["numero_de_tarjeta"],)
            )
            if cursor.fetchone():
                raise ValueError("El número de tarjeta ya está registrado")

            cursor.execute(
                "SELECT id_trabajador FROM trabajadores WHERE numero_trabajador = %s",
                (datos["numero_trabajador"],)
            )
            if cursor.fetchone():
                raise ValueError("El número de trabajador ya está registrado")

            cursor.execute(
                "SELECT id_qr FROM qrs WHERE qr = %s",
                (datos["qr"]["qr"],)
            )
            if cursor.fetchone():
                raise ValueError("El token QR ya está registrado")

            sql_emergencia = """
                INSERT INTO datos_de_emergencia (nombre, telefono)
                VALUES (%s, %s) 
            """
            cursor.execute(sql_emergencia, (
                datos["datos_emergencia"]["nombre"],
                datos["datos_emergencia"]["telefono"]
            ))
            id_datos_emergencia = cursor.lastrowid

            sql_vigencia = """
                INSERT INTO vigencias (fecha_inicio, fecha_vencimiento)
                VALUES (%s, %s)
            """
            cursor.execute(sql_vigencia, (
                datos["vigencia"]["fecha_inicio"],
                datos["vigencia"]["fecha_vencimiento"]
            ))
            id_vigencia = cursor.lastrowid

            sql_estado = """
                INSERT INTO estado (estado)
                VALUES (%s)
            """
            cursor.execute(sql_estado, (True,))
            id_estado = cursor.lastrowid

            sql_qr = """
                INSERT INTO qrs (qr)
                VALUES (%s)
            """
            cursor.execute(sql_qr, (datos["qr"]["qr"],))
            id_qr = cursor.lastrowid

            sql_trabajador = """
                INSERT INTO trabajadores (
                    nombre_completo, edad, sexo, curp, numero_trabajador,
                    numero_de_tarjeta, area_adscripcion, cargo, correo, fotografia,
                    id_datos_emergencia, id_vigencia, id_estado, id_qr
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql_trabajador, (
                datos["nombre_completo"],
                datos["edad"],
                datos["sexo"],
                datos["curp"],
                datos["numero_trabajador"],
                datos["numero_de_tarjeta"],
                datos["area_adscripcion"],
                datos["cargo"],
                datos["correo"],
                datos["fotografia"],
                id_datos_emergencia,
                id_vigencia,
                id_estado,
                id_qr
            ))
            id_trabajador = cursor.lastrowid

        conexion.commit()
        return {
            "mensaje": "Trabajador registrado exitosamente",
            "id_trabajador": id_trabajador
        }

    except Exception as e:
        conexion.rollback()
        raise e
    finally:
        conexion.close()


def obtener_todos_los_trabajadores() -> list:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = "SELECT * FROM trabajadores"
            cursor.execute(sql)
            return cursor.fetchall()
    finally:
        conexion.close()


def obtener_trabajador_por_id(id_trabajador: int) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = "SELECT * FROM trabajadores WHERE id_trabajador = %s"
            cursor.execute(sql, (id_trabajador,))
            resultado = cursor.fetchone()
            return resultado
    finally:
        conexion.close()


def actualizar_trabajador_parcial(id_trabajador: int, datos: dict) -> dict:
    if not datos:
        return {"mensaje": "No se enviaron campos para actualizar"}

    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            if "numero_de_tarjeta" in datos:
                cursor.execute(
                    "SELECT id_trabajador FROM trabajadores WHERE numero_de_tarjeta = %s AND id_trabajador <> %s",
                    (datos["numero_de_tarjeta"], id_trabajador)
                )
                if cursor.fetchone():
                    raise ValueError("El número de tarjeta ya está registrado")

            if "numero_trabajador" in datos:
                cursor.execute(
                    "SELECT id_trabajador FROM trabajadores WHERE numero_trabajador = %s AND id_trabajador <> %s",
                    (datos["numero_trabajador"], id_trabajador)
                )
                if cursor.fetchone():
                    raise ValueError("El número de trabajador ya está registrado")

            campos = [f"{clave} = %s" for clave in datos.keys()]
            valores = list(datos.values())
            valores.append(id_trabajador)

            sql = f"UPDATE trabajadores SET {', '.join(campos)} WHERE id_trabajador = %s"
            cursor.execute(sql, valores)

        conexion.commit()
        return {"mensaje": f"Trabajador {id_trabajador} actualizado correctamente"}
    except Exception as e:
        conexion.rollback()
        raise e
    finally:
        conexion.close()


def eliminar_trabajador_por_id(id_trabajador: int) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql_get_ids = """
                SELECT id_datos_emergencia, id_vigencia, id_estado, id_qr 
                FROM trabajadores WHERE id_trabajador = %s
            """
            cursor.execute(sql_get_ids, (id_trabajador,))
            relaciones = cursor.fetchone()

            if not relaciones:
                return None

            cursor.execute("DELETE FROM trabajadores WHERE id_trabajador = %s", (id_trabajador,))

            cursor.execute("DELETE FROM datos_de_emergencia WHERE id_datos_emergencia = %s", (relaciones["id_datos_emergencia"],))
            cursor.execute("DELETE FROM vigencias WHERE id_vigencia = %s", (relaciones["id_vigencia"],))
            cursor.execute("DELETE FROM estado WHERE id_estado = %s", (relaciones["id_estado"],))
            cursor.execute("DELETE FROM qrs WHERE id_qr = %s", (relaciones["id_qr"],))

        conexion.commit()
        return {"mensaje": f"Trabajador {id_trabajador} y sus registros relacionados fueron eliminados exitosamente"}
    except Exception as e:
        conexion.rollback()
        raise e
    finally:
        conexion.close()


def obtener_estado_trabajador(id_trabajador: int) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT e.id_estado, e.estado 
                FROM trabajadores t
                JOIN estado e ON t.id_estado = e.id_estado
                WHERE t.id_trabajador = %s
            """
            cursor.execute(sql, (id_trabajador,))
            return cursor.fetchone()
    finally:
        conexion.close()


def actualizar_estado_trabajador(id_trabajador: int, estado: bool) -> dict | None:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT id_estado FROM trabajadores WHERE id_trabajador = %s",
                (id_trabajador,)
            )
            resultado = cursor.fetchone()
            if not resultado:
                return None

            cursor.execute(
                "UPDATE estado SET estado = %s WHERE id_estado = %s",
                (estado, resultado["id_estado"])
            )

        conexion.commit()
        return {"estado": estado}
    except Exception as e:
        conexion.rollback()
        raise e
    finally:
        conexion.close()


def obtener_datos_emergencia_trabajador(id_trabajador: int) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT d.id_datos_emergencia, d.nombre, d.telefono 
                FROM trabajadores t
                JOIN datos_de_emergencia d ON t.id_datos_emergencia = d.id_datos_emergencia
                WHERE t.id_trabajador = %s
            """
            cursor.execute(sql, (id_trabajador,))
            return cursor.fetchone()
    finally:
        conexion.close()


def obtener_vigencia_trabajador(id_trabajador: int) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT v.id_vigencia, v.fecha_inicio, v.fecha_vencimiento 
                FROM trabajadores t
                JOIN vigencias v ON t.id_vigencia = v.id_vigencia
                WHERE t.id_trabajador = %s
            """
            cursor.execute(sql, (id_trabajador,))
            return cursor.fetchone()
    finally:
        conexion.close()


def obtener_qr_trabajador(id_trabajador: int) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT q.id_qr, q.qr 
                FROM trabajadores t
                JOIN qrs q ON t.id_qr = q.id_qr
                WHERE t.id_trabajador = %s
            """
            cursor.execute(sql, (id_trabajador,))
            return cursor.fetchone()
    finally:
        conexion.close()


def actualizar_vigencia_trabajador(
    id_trabajador: int, 
    fecha_inicio: str, 
    fecha_vencimiento: str, 
    activa_periodo: bool = True, 
    desactivada_admin: bool = False
) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql_get_id = "SELECT id_vigencia FROM trabajadores WHERE id_trabajador = %s"
            cursor.execute(sql_get_id, (id_trabajador,))
            resultado = cursor.fetchone()

            if not resultado:
                return None

            id_vigencia = resultado["id_vigencia"]

            sql_update = """
                UPDATE vigencias 
                SET fecha_inicio = %s, 
                    fecha_vencimiento = %s, 
                    credencial_activa_dentro_del_periodo = %s, 
                    credencial_desactivada_por_el_administrador = %s
                WHERE id_vigencia = %s
            """
            cursor.execute(
                sql_update, 
                (fecha_inicio, fecha_vencimiento, activa_periodo, desactivada_admin, id_vigencia)
            )

        conexion.commit()
        
        return {
            "fecha_inicio": fecha_inicio,
            "fecha_vencimiento": fecha_vencimiento,
            "credencial_activa_dentro_del_periodo": activa_periodo,
            "credencial_desactivada_por_el_administrador": desactivada_admin
        }
    except Exception as e:
        conexion.rollback()
        raise e
    finally:
        conexion.close()
        
def obtener_credenciales_de_un_trabajador(id_trabajador: int) -> dict:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT 
                    t.fotografia,
                    t.nombre_completo,
                    t.id_trabajador,
                    t.area_adscripcion,
                    t.cargo,
                    t.numero_de_tarjeta,
                    v.fecha_vencimiento,
                    e.estado
                FROM trabajadores t
                INNER JOIN vigencias v ON t.id_vigencia = v.id_vigencia
                INNER JOIN estado e ON t.id_estado = e.id_estado
                WHERE t.id_trabajador = %s
            """
            cursor.execute(sql, (id_trabajador,))

            return cursor.fetchone()
    finally:
        conexion.close()



def autenticar_administrador(correo: str, password: str) -> dict | None:
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Buscamos al administrador por su correo (sin distinguir mayúsculas)
            sql = """
                SELECT id_administrador, nombre, correo, password
                FROM administrador
                WHERE LOWER(correo) = LOWER(%s)
                LIMIT 1
            """
            cursor.execute(sql, (correo.strip(),))
            admin = cursor.fetchone()

            if not admin:
                return None  # El correo no existe

            # Verificamos la contraseña encriptada con bcrypt
            try:
                password_valida = bcrypt.checkpw(
                    password.encode("utf-8"),
                    admin["password"].encode("utf-8")
                )
            except ValueError:
                # El hash guardado no es un hash bcrypt válido
                return None

            if not password_valida:
                return None

            return {
                "id_administrador": admin["id_administrador"],
                "nombre": admin["nombre"],
                "correo": admin["correo"]
            }
    finally:
        conexion.close()


def crear_administrador(nombre: str, correo: str, password: str) -> dict:
    nombre = nombre.strip()
    correo = correo.strip().lower()

    if not nombre:
        raise ValueError("El nombre es obligatorio")
    if not correo:
        raise ValueError("El correo es obligatorio")
    if len(password) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")

    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 1. Verificar si el correo ya está registrado
            sql_check = "SELECT id_administrador FROM administrador WHERE LOWER(correo) = LOWER(%s)"
            cursor.execute(sql_check, (correo,))
            if cursor.fetchone():
                raise ValueError("El correo electrónico ya está registrado")

            # 2. Hashear la contraseña con bcrypt de forma segura
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # 3. Insertar el nuevo administrador incluyendo el nombre
            sql_insert = "INSERT INTO administrador (nombre, correo, password) VALUES (%s, %s, %s)"
            cursor.execute(sql_insert, (nombre, correo, hashed_password))

            conexion.commit()

            # Retornar datos de confirmación
            return {
                "mensaje": "Administrador creado exitosamente",
                "id_administrador": cursor.lastrowid,
                "nombre": nombre,
                "correo": correo
            }
    except ValueError as ve:
        raise ve
    except Exception as e:
        conexion.rollback()
        raise e
    finally:
        conexion.close()


SQL_CREDENCIAL_PUBLICA = """
    SELECT
        t.id_trabajador,
        t.nombre_completo,
        t.numero_trabajador,
        t.numero_de_tarjeta,
        t.area_adscripcion,
        t.cargo,
        t.fotografia,
        v.fecha_inicio,
        v.fecha_vencimiento,
        v.credencial_activa_dentro_del_periodo,
        v.credencial_desactivada_por_el_administrador,
        e.estado
    FROM trabajadores t
    INNER JOIN vigencias v ON t.id_vigencia = v.id_vigencia
    INNER JOIN estado e ON t.id_estado = e.id_estado
    {filtro}
    LIMIT 1
"""


def obtener_credencial_por_qr(token: str) -> dict | None:
    """Busca por token QR y, como respaldo, por número de tarjeta.

    El Reto 3 permite que el QR apunte a /verify/{id_unico} o
    /verify/{numero_tarjeta}; este respaldo cubre ambas variantes.
    """
    valor = token.strip()
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                SQL_CREDENCIAL_PUBLICA.format(filtro="INNER JOIN qrs q ON t.id_qr = q.id_qr WHERE q.qr = %s"),
                (valor,),
            )
            resultado = cursor.fetchone()
            if resultado:
                return resultado

            cursor.execute(
                SQL_CREDENCIAL_PUBLICA.format(filtro="WHERE t.numero_de_tarjeta = %s"),
                (valor,),
            )
            return cursor.fetchone()
    finally:
        conexion.close()


def obtener_datos_notificacion(id_trabajador: int) -> dict | None:
    """Datos completos para construir las notificaciones por correo."""
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT
                    t.id_trabajador,
                    t.nombre_completo,
                    t.numero_trabajador,
                    t.numero_de_tarjeta,
                    t.area_adscripcion,
                    t.cargo,
                    t.correo,
                    t.fotografia,
                    v.fecha_inicio,
                    v.fecha_vencimiento,
                    v.credencial_activa_dentro_del_periodo,
                    v.credencial_desactivada_por_el_administrador,
                    e.estado,
                    q.qr
                FROM trabajadores t
                INNER JOIN vigencias v ON t.id_vigencia = v.id_vigencia
                INNER JOIN estado e ON t.id_estado = e.id_estado
                INNER JOIN qrs q ON t.id_qr = q.id_qr
                WHERE t.id_trabajador = %s
            """
            cursor.execute(sql, (id_trabajador,))
            return cursor.fetchone()
    finally:
        conexion.close()

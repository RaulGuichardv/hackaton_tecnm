-- Agrega los trabajadores de demostración TRAB-0003 a TRAB-0010 si no existen.
-- Es idempotente: puede ejecutarse varias veces sin duplicar registros.
--   mysql -u root -p credetec < base_de_datos/seed_trabajadores.sql
USE credetec;

DROP PROCEDURE IF EXISTS seed_trabajador_demo;

DELIMITER //
CREATE PROCEDURE seed_trabajador_demo(
    IN p_nombre VARCHAR(120),
    IN p_edad INT,
    IN p_sexo VARCHAR(10),
    IN p_curp VARCHAR(18),
    IN p_numero_trabajador VARCHAR(50),
    IN p_numero_tarjeta VARCHAR(30),
    IN p_area VARCHAR(100),
    IN p_cargo VARCHAR(100),
    IN p_correo VARCHAR(100),
    IN p_foto VARCHAR(255),
    IN p_em_nombre VARCHAR(100),
    IN p_em_telefono VARCHAR(20),
    IN p_inicio DATETIME,
    IN p_fin DATETIME,
    IN p_estado BOOLEAN,
    IN p_qr VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM trabajadores WHERE numero_trabajador = p_numero_trabajador) THEN
        INSERT INTO datos_de_emergencia (nombre, telefono)
        VALUES (p_em_nombre, p_em_telefono);
        SET @id_em = LAST_INSERT_ID();

        INSERT INTO vigencias (
            credencial_activa_dentro_del_periodo,
            credencial_desactivada_por_el_administrador,
            fecha_inicio,
            fecha_vencimiento
        ) VALUES (TRUE, FALSE, p_inicio, p_fin);
        SET @id_vig = LAST_INSERT_ID();

        INSERT INTO estado (estado) VALUES (p_estado);
        SET @id_estado = LAST_INSERT_ID();

        INSERT INTO qrs (qr) VALUES (p_qr);
        SET @id_qr = LAST_INSERT_ID();

        INSERT INTO trabajadores (
            nombre_completo, edad, sexo, curp, numero_trabajador,
            numero_de_tarjeta, area_adscripcion, cargo, correo, fotografia,
            id_datos_emergencia, id_vigencia, id_estado, id_qr
        ) VALUES (
            p_nombre, p_edad, p_sexo, p_curp, p_numero_trabajador,
            p_numero_tarjeta, p_area, p_cargo, p_correo, p_foto,
            @id_em, @id_vig, @id_estado, @id_qr
        );
    END IF;
END //
DELIMITER ;

CALL seed_trabajador_demo(
    'Ana Sofía Martínez López', 29, 'mujer', 'MALA970315MDFRPN05', 'TRAB-0003',
    '1000000000000003', 'Recursos Humanos', 'Analista de personal',
    'ana.martinez@credetec.com', '/uploads/fotos/seed_ana.jpg',
    'Rosa López (Madre)', '9612000003',
    '2026-01-01 00:00:00', '2026-12-31 23:59:59', TRUE,
    'bb6fcaac-d9ec-495f-ae58-7acfc3843362'
);

CALL seed_trabajador_demo(
    'Carlos Eduardo Ramírez Torres', 41, 'hombre', 'RATC850620HDFMRR09', 'TRAB-0004',
    '1000000000000004', 'Finanzas', 'Contador',
    'carlos.ramirez@credetec.com', '/uploads/fotos/seed_carlos.jpg',
    'Elena Torres (Esposa)', '9612000004',
    '2026-01-01 00:00:00', '2026-12-31 23:59:59', TRUE,
    'd6e97346-345a-4263-a152-bc0d41bd946c'
);

CALL seed_trabajador_demo(
    'María Fernanda Gómez Ruiz', 34, 'mujer', 'GORM920810MDFMRS04', 'TRAB-0005',
    '1000000000000005', 'Dirección', 'Coordinadora administrativa',
    'maria.gomez@credetec.com', '/uploads/fotos/seed_maria.jpg',
    'Javier Gómez (Hermano)', '9612000005',
    '2026-01-01 00:00:00', '2026-12-31 23:59:59', TRUE,
    '718111d7-545f-4767-945a-faa2d8f7ef4b'
);

CALL seed_trabajador_demo(
    'José Luis Hernández Cruz', 45, 'hombre', 'HECJ810102HDFRRS07', 'TRAB-0006',
    '1000000000000006', 'Mantenimiento', 'Técnico eléctrico',
    'jose.hernandez@credetec.com', '/uploads/fotos/seed_jose.jpg',
    'Cruz Hernández (Madre)', '9612000006',
    '2026-01-01 00:00:00', '2026-12-31 23:59:59', TRUE,
    '0839f9d9-5627-4cd6-9cf4-412dd9e86db3'
);

CALL seed_trabajador_demo(
    'Laura Patricia Jiménez Soto', 31, 'mujer', 'JISL950428MDFMTR01', 'TRAB-0007',
    '1000000000000007', 'Jurídico', 'Abogada',
    'laura.jimenez@credetec.com', '/uploads/fotos/seed_laura.jpg',
    'Soto Jiménez (Padre)', '9612000007',
    '2026-01-01 00:00:00', '2026-12-31 23:59:59', TRUE,
    '578e9098-afae-404a-a0e6-cca03c500c2e'
);

CALL seed_trabajador_demo(
    'Miguel Ángel Flores Navarro', 38, 'hombre', 'FONM870912HDFLVR03', 'TRAB-0008',
    '1000000000000008', 'Operaciones', 'Supervisor de turno',
    'miguel.flores@credetec.com', '/uploads/fotos/seed_miguel.jpg',
    'Navarro Flores (Esposa)', '9612000008',
    '2026-01-01 00:00:00', '2026-12-31 23:59:59', FALSE,
    'e5933c24-7c0a-425b-a89b-36e12d844842'
);

CALL seed_trabajador_demo(
    'Patricia Elena Vargas Cano', 27, 'mujer', 'VACP990205MDFRNT08', 'TRAB-0009',
    '1000000000000009', 'Comunicación', 'Diseñadora gráfica',
    'patricia.vargas@credetec.com', '/uploads/fotos/seed_patricia.jpg',
    'Cano Vargas (Hermana)', '9612000009',
    '2025-01-01 00:00:00', '2025-12-31 23:59:59', TRUE,
    'ea44a96b-de94-49fa-9c76-cd2e2c7820ba'
);

CALL seed_trabajador_demo(
    'Jorge Alberto Mendoza Ríos', 33, 'hombre', 'MERR930718HDFNDR02', 'TRAB-0010',
    '1000000000000010', 'Tecnologías', 'Administrador de redes',
    'jorge.mendoza@credetec.com', '/uploads/fotos/seed_jorge.jpg',
    'Ríos Mendoza (Madre)', '9612000010',
    '2027-01-01 00:00:00', '2027-12-31 23:59:59', TRUE,
    'eae63049-c727-4eba-9265-45ef06dbea9f'
);

DROP PROCEDURE IF EXISTS seed_trabajador_demo;

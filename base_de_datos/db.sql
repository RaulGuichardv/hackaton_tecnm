CREATE DATABASE IF NOT EXISTS credetec;
USE credetec;

CREATE TABLE IF NOT EXISTS administrador (
    id_administrador INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS datos_de_emergencia (
    id_datos_emergencia INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL 
);

CREATE TABLE IF NOT EXISTS vigencias (
    id_vigencia INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    credencial_activa_dentro_del_periodo BOOLEAN DEFAULT TRUE NOT NULL,
    credencial_desactivada_por_el_administrador BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_vencimiento DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS estado (
    id_estado INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    estado BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS qrs (
    id_qr INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    qr VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_qr_token (qr)
);

CREATE TABLE IF NOT EXISTS trabajadores (
    id_trabajador INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    edad INT NOT NULL,
    sexo ENUM("hombre", "mujer", "otros") NOT NULL,
    curp VARCHAR(18) NOT NULL,
    numero_trabajador VARCHAR(50) NOT NULL,
    numero_de_tarjeta VARCHAR(30) NOT NULL,
    area_adscripcion VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    fotografia VARCHAR(255) NOT NULL,
    
    id_datos_emergencia INT NOT NULL,
    id_vigencia INT NOT NULL,
    id_estado INT NOT NULL,
    id_qr INT NOT NULL,
    UNIQUE KEY uq_trabajador_numero (numero_trabajador),
    UNIQUE KEY uq_numero_de_tarjeta (numero_de_tarjeta),
    CONSTRAINT fk_trabajador_emergencia
        FOREIGN KEY (id_datos_emergencia) REFERENCES datos_de_emergencia(id_datos_emergencia),
    CONSTRAINT fk_trabajador_vigencia 
        FOREIGN KEY (id_vigencia) REFERENCES vigencias(id_vigencia),
    CONSTRAINT fk_trabajador_estado 
        FOREIGN KEY (id_estado) REFERENCES estado(id_estado),
    CONSTRAINT fk_trabajador_qr 
        FOREIGN KEY (id_qr) REFERENCES qrs(id_qr)
);

-- Administrador de prueba: admin@credetec.com / Admin1234!
-- Se inserta solo si no existe para poder ejecutar el script varias veces.
UPDATE administrador
SET nombre = 'raul',
    password = '$2b$12$2FkPvzNR4APzKl609GmF7.duPjaUxfyLFfyUFuGj6yWVpbXZBQ.Nu'
WHERE correo = 'admin@credetec.com';

INSERT INTO administrador (nombre, correo, password)
SELECT 'raul', 'admin@credetec.com', '$2b$12$2FkPvzNR4APzKl609GmF7.duPjaUxfyLFfyUFuGj6yWVpbXZBQ.Nu'
WHERE NOT EXISTS (
    SELECT 1 FROM administrador WHERE correo = 'admin@credetec.com'
);

INSERT INTO datos_de_emergencia (nombre, telefono) VALUES 
('Maria Gomez (Esposa)', '9611234567'),
('Angel', '9321084680'),
('Rosa López (Madre)', '9612000003'),
('Elena Torres (Esposa)', '9612000004'),
('Javier Gómez (Hermano)', '9612000005'),
('Cruz Hernández (Madre)', '9612000006'),
('Soto Jiménez (Padre)', '9612000007'),
('Navarro Flores (Esposa)', '9612000008'),
('Cano Vargas (Hermana)', '9612000009'),
('Ríos Mendoza (Madre)', '9612000010');

INSERT INTO vigencias (credencial_activa_dentro_del_periodo, credencial_desactivada_por_el_administrador, fecha_inicio, fecha_vencimiento) VALUES 
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2025-01-01 00:00:00', '2025-12-31 23:59:59'),
(TRUE, FALSE, '2027-01-01 00:00:00', '2027-12-31 23:59:59');

INSERT INTO estado (estado) VALUES 
(TRUE),
(TRUE),
(TRUE),
(TRUE),
(TRUE),
(TRUE),
(TRUE),
(FALSE),
(TRUE),
(TRUE);

INSERT INTO qrs (qr) VALUES 
('dd5885fc-d8a6-11f1-9c9c-84c8a0516652'),
('dd58880d-d8a6-11f1-9c9c-84c8a0516652'),
('bb6fcaac-d9ec-495f-ae58-7acfc3843362'),
('d6e97346-345a-4263-a152-bc0d41bd946c'),
('718111d7-545f-4767-945a-faa2d8f7ef4b'),
('0839f9d9-5627-4cd6-9cf4-412dd9e86db3'),
('578e9098-afae-404a-a0e6-cca03c500c2e'),
('e5933c24-7c0a-425b-a89b-36e12d844842'),
('ea44a96b-de94-49fa-9c76-cd2e2c7820ba'),
('eae63049-c727-4eba-9265-45ef06dbea9f');

INSERT INTO trabajadores (nombre_completo, edad, sexo, curp, numero_trabajador, numero_de_tarjeta, area_adscripcion, cargo, correo, fotografia, id_datos_emergencia, id_vigencia, id_estado, id_qr) VALUES
('Roberto Carlos Hernandez', 35, 'hombre', 'HEHR880101HDFRXX01', 'TRAB-0001', '4589231092341234', 'Sistemas', 'Desarrollador Senior', 'trabajador1@credetec.com', '/uploads/fotos/roberto.jpg', 1, 1, 1, 1),
('monse', 20, 'mujer', 'MONS880101SIXRXX01', 'TRAB-0002', '3211232043348902', 'desarrollo', 'Desarrollador junior', 'trabajador2@credetec.com', '/uploads/fotos/monse.jpg', 2, 2, 2, 2),
('Ana Sofía Martínez López', 29, 'mujer', 'MALA970315MDFRPN05', 'TRAB-0003', '1000000000000003', 'Recursos Humanos', 'Analista de personal', 'ana.martinez@credetec.com', '/uploads/fotos/seed_ana.jpg', 3, 3, 3, 3),
('Carlos Eduardo Ramírez Torres', 41, 'hombre', 'RATC850620HDFMRR09', 'TRAB-0004', '1000000000000004', 'Finanzas', 'Contador', 'carlos.ramirez@credetec.com', '/uploads/fotos/seed_carlos.jpg', 4, 4, 4, 4),
('María Fernanda Gómez Ruiz', 34, 'mujer', 'GORM920810MDFMRS04', 'TRAB-0005', '1000000000000005', 'Dirección', 'Coordinadora administrativa', 'maria.gomez@credetec.com', '/uploads/fotos/seed_maria.jpg', 5, 5, 5, 5),
('José Luis Hernández Cruz', 45, 'hombre', 'HECJ810102HDFRRS07', 'TRAB-0006', '1000000000000006', 'Mantenimiento', 'Técnico eléctrico', 'jose.hernandez@credetec.com', '/uploads/fotos/seed_jose.jpg', 6, 6, 6, 6),
('Laura Patricia Jiménez Soto', 31, 'mujer', 'JISL950428MDFMTR01', 'TRAB-0007', '1000000000000007', 'Jurídico', 'Abogada', 'laura.jimenez@credetec.com', '/uploads/fotos/seed_laura.jpg', 7, 7, 7, 7),
('Miguel Ángel Flores Navarro', 38, 'hombre', 'FONM870912HDFLVR03', 'TRAB-0008', '1000000000000008', 'Operaciones', 'Supervisor de turno', 'miguel.flores@credetec.com', '/uploads/fotos/seed_miguel.jpg', 8, 8, 8, 8),
('Patricia Elena Vargas Cano', 27, 'mujer', 'VACP990205MDFRNT08', 'TRAB-0009', '1000000000000009', 'Comunicación', 'Diseñadora gráfica', 'patricia.vargas@credetec.com', '/uploads/fotos/seed_patricia.jpg', 9, 9, 9, 9),
('Jorge Alberto Mendoza Ríos', 33, 'hombre', 'MERR930718HDFNDR02', 'TRAB-0010', '1000000000000010', 'Tecnologías', 'Administrador de redes', 'jorge.mendoza@credetec.com', '/uploads/fotos/seed_jorge.jpg', 10, 10, 10, 10);
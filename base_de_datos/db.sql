CREATE DATABASE IF NOT EXISTS credetec;
USE credetec;

CREATE TABLE IF NOT EXISTS administrador (
    id_administrador INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
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
    qr VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS trabajadores (
    id_trabajador INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    edad INT NOT NULL,
    sexo ENUM("hombre", "mujer", "otros") NOT NULL,
    curp VARCHAR(18) NOT NULL,
    numero_de_tarjeta BIGINT NOT NULL, 
    area_adscripcion VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    fotografia VARCHAR(255) NOT NULL,
    
    id_datos_emergencia INT NOT NULL,
    id_vigencia INT NOT NULL,
    id_estado INT NOT NULL,
    id_qr INT NOT NULL,
    CONSTRAINT fk_trabajador_emergencia
        FOREIGN KEY (id_datos_emergencia) REFERENCES datos_de_emergencia(id_datos_emergencia),
    CONSTRAINT fk_trabajador_vigencia 
        FOREIGN KEY (id_vigencia) REFERENCES vigencias(id_vigencia),
    CONSTRAINT fk_trabajador_estado 
        FOREIGN KEY (id_estado) REFERENCES estado(id_estado),
    CONSTRAINT fk_trabajador_qr 
        FOREIGN KEY (id_qr) REFERENCES qrs(id_qr)
);

INSERT INTO administrador (nombre, correo, password) VALUES 
('raul', 'admin@credetec.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/kJ02.6.2S');

INSERT INTO datos_de_emergencia (nombre, telefono) VALUES 
('Maria Gomez (Esposa)', '9611234567'),
('Angel', '9321084680');

INSERT INTO vigencias (credencial_activa_dentro_del_periodo, credencial_desactivada_por_el_administrador, fecha_inicio, fecha_vencimiento) VALUES 
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(TRUE, FALSE, '2026-01-01 00:00:00', '2026-12-31 23:59:59');

INSERT INTO estado (estado) VALUES 
(TRUE),
(TRUE);

INSERT INTO qrs (qr) VALUES 
('/uploads/qrs/trabajador_1.png'),
('/uploads/qrs/trabajador_2.png');

INSERT INTO trabajadores (nombre_completo, edad, sexo, curp, numero_de_tarjeta, area_adscripcion, cargo, fotografia, id_datos_emergencia, id_vigencia, id_estado, id_qr) VALUES 
('Roberto Carlos Hernandez', 35, 'hombre', 'HEHR880101HDFRXX01', 4589231092341234, 'Sistemas', 'Desarrollador Senior', '/uploads/fotos/roberto.jpg', 1, 1, 1, 1),
('monse', 20, 'mujer', 'MONS880101SIXRXX01', 3211232043348902, 'desarrollo', 'Desarrollador junior', '/uploads/fotos/monse.jpg', 2, 2, 2, 2);
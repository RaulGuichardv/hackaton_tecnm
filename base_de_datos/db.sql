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

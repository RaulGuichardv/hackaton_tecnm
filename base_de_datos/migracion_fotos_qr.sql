-- Migración para bases de datos creadas antes de la carga de fotografías y QR públicos.
-- Ejecutar una sola vez sobre una base existente:
--   mysql -u root -p credetec < base_de_datos/migracion_fotos_qr.sql
USE credetec;

ALTER TABLE trabajadores
    ADD COLUMN IF NOT EXISTS numero_trabajador VARCHAR(50) NULL AFTER curp,
    ADD COLUMN IF NOT EXISTS correo VARCHAR(100) NULL AFTER cargo;

UPDATE trabajadores
SET numero_trabajador = CONCAT('TRAB-', LPAD(id_trabajador, 4, '0'))
WHERE numero_trabajador IS NULL OR numero_trabajador = '';

UPDATE trabajadores
SET correo = CONCAT('trabajador', id_trabajador, '@credetec.com')
WHERE correo IS NULL OR correo = '';

ALTER TABLE trabajadores
    MODIFY numero_trabajador VARCHAR(50) NOT NULL,
    MODIFY correo VARCHAR(100) NOT NULL,
    ADD UNIQUE KEY IF NOT EXISTS uq_trabajador_numero (numero_trabajador),
    ADD UNIQUE KEY IF NOT EXISTS uq_numero_de_tarjeta (numero_de_tarjeta);

-- Los QR antiguos guardaban rutas de imagen; ahora deben ser tokens únicos.
UPDATE qrs SET qr = UUID() WHERE qr LIKE '/uploads/%';
ALTER TABLE qrs ADD UNIQUE KEY IF NOT EXISTS uq_qr_token (qr);

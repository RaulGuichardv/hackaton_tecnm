-- Migración: el número de tarjeta debe ser String (permite ceros iniciales
-- y longitudes mayores al rango numérico de JavaScript).
-- Ejecutar una sola vez sobre una base existente:
--   mysql -u root -p credetec < base_de_datos/migracion_tarjeta_varchar.sql
USE credetec;

ALTER TABLE trabajadores
    MODIFY numero_de_tarjeta VARCHAR(30) NOT NULL;

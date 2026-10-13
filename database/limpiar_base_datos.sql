-- ====================================================================
-- SISTEMA FLOW STREAM - LIMPIEZA COMPLETA DE BASE DE DATOS
-- Archivo: database/limpiar_base_datos.sql
-- Descripción: Elimina todos los registros de prueba y reinicia los contadores (IDs a 1)
-- ====================================================================

-- --------------------------------------------------------------------
-- OPCIÓN A: PARA SUPABASE / POSTGRESQL / NEON
-- (Copia y pega este bloque en el SQL Editor de Supabase)
-- --------------------------------------------------------------------
TRUNCATE TABLE historial_renovaciones, clientes, perfiles, cuentas_streaming RESTART IDENTITY CASCADE;


-- --------------------------------------------------------------------
-- OPCIÓN B: PARA MYSQL / MARIADB / PHPMYADMIN
-- (Copia y pega este bloque en phpMyAdmin o MySQL Workbench)
-- --------------------------------------------------------------------
/*
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE historial_renovaciones;
TRUNCATE TABLE clientes;
TRUNCATE TABLE perfiles;
TRUNCATE TABLE cuentas_streaming;

SET FOREIGN_KEY_CHECKS = 1;
*/

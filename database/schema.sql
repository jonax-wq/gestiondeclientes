-- ====================================================================
-- SISTEMA FLOW STREAM - GESTIÓN DE CUENTAS DE STREAMING Y CLIENTES
-- Archivo: database/schema.sql
-- Descripción: Estructura de base de datos relacional (DDL)
-- Compatible con: MySQL 8.x / MariaDB 10.x / PostgreSQL / SQLite
-- ====================================================================

-- 1. TABLA: CUENTAS DE STREAMING (Cuentas Maestras / Cuentas Completas)
-- Almacena las cuentas principales que administras (Netflix, Disney+, HBO Max, etc.)
CREATE TABLE IF NOT EXISTS cuentas_streaming (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plataforma VARCHAR(50) NOT NULL COMMENT 'Netflix, Disney+, HBO Max, Prime Video, Spotify, Paramount+, etc.',
    correo VARCHAR(150) NOT NULL COMMENT 'Correo de acceso a la cuenta',
    password VARCHAR(150) NOT NULL COMMENT 'Contraseña de la cuenta',
    fecha_corte_cuenta DATE NOT NULL COMMENT 'Fecha en que vence la cuenta completa con tu proveedor',
    costo_cuenta DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Costo mensual que pagas por la cuenta en soles (S/)',
    cantidad_perfiles INT NOT NULL DEFAULT 5 COMMENT 'Número de perfiles o pantallas disponibles en la cuenta',
    proveedor VARCHAR(100) DEFAULT NULL COMMENT 'Nombre o contacto del proveedor que te vende la cuenta',
    notas TEXT DEFAULT NULL COMMENT 'Observaciones (ej. método de pago, no cambiar contraseña, etc.)',
    estado ENUM('activa', 'suspendida', 'vencida') DEFAULT 'activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_plataforma (plataforma),
    INDEX idx_fecha_corte (fecha_corte_cuenta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. TABLA: PERFILES
-- Almacena cada pantalla/perfil individual dentro de una cuenta maestra
CREATE TABLE IF NOT EXISTS perfiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuenta_id INT NOT NULL COMMENT 'ID de la cuenta a la que pertenece el perfil',
    numero_perfil INT NOT NULL COMMENT 'Número o posición del perfil (ej. 1, 2, 3, 4, 5)',
    nombre_perfil VARCHAR(60) NOT NULL COMMENT 'Nombre del perfil en la plataforma (ej. Perfil 1, Pantalla 1)',
    pin VARCHAR(10) DEFAULT '' COMMENT 'PIN de bloqueo del perfil (si aplica)',
    estado ENUM('disponible', 'asignado', 'bloqueado') DEFAULT 'disponible' COMMENT 'Estado del perfil',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_perfiles_cuenta FOREIGN KEY (cuenta_id) 
        REFERENCES cuentas_streaming(id) 
        ON DELETE CASCADE,
    INDEX idx_cuenta_estado (cuenta_id, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. TABLA: CLIENTES Y MEMBRESÍAS
-- Almacena la asignación de un cliente a un perfil, su número de celular y fecha de vencimiento
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) DEFAULT 'Cliente' COMMENT 'Nombre o alias para identificar al cliente',
    codigo_pais VARCHAR(6) NOT NULL DEFAULT '+51' COMMENT 'Código telefónico del país (ej. +51 Perú, +57 Colombia, +52 México)',
    celular VARCHAR(25) NOT NULL COMMENT 'Número de WhatsApp sin el código de país',
    celular_completo VARCHAR(35) NOT NULL COMMENT 'Número internacional completo para enlace de WhatsApp',
    perfil_id INT NOT NULL COMMENT 'ID del perfil que se le asigna al cliente',
    pin VARCHAR(10) NOT NULL COMMENT 'PIN asignado para ingresar a su perfil',
    fecha_inicio DATE NOT NULL COMMENT 'Fecha en que inicia el servicio',
    fecha_vencimiento DATE NOT NULL COMMENT 'Fecha de corte del cliente (30 días de duración por defecto)',
    precio_cobrado DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Monto cobrado al cliente por los 30 días',
    estado ENUM('activo', 'por_vencer', 'vencido', 'renovado', 'cancelado') DEFAULT 'activo',
    recordatorio_enviado TINYINT(1) DEFAULT 0 COMMENT '1 si ya se le envió el WhatsApp de recordatorio',
    ultimo_mensaje_enviado TIMESTAMP NULL DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientes_perfil FOREIGN KEY (perfil_id) 
        REFERENCES perfiles(id) 
        ON DELETE RESTRICT,
    INDEX idx_celular (celular),
    INDEX idx_fecha_vencimiento (fecha_vencimiento),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. TABLA: HISTORIAL DE RENOVACIONES
-- Permite registrar cada vez que un cliente renueva su mes y auditar ingresos
CREATE TABLE IF NOT EXISTS historial_renovaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    perfil_id INT NOT NULL,
    fecha_renovacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento_anterior DATE NOT NULL,
    nueva_fecha_vencimiento DATE NOT NULL,
    monto_cobrado DECIMAL(10, 2) DEFAULT 0.00,
    metodo_pago VARCHAR(50) DEFAULT 'Transferencia/Yape/Plin',
    CONSTRAINT fk_renovacion_cliente FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) 
        ON DELETE CASCADE,
    INDEX idx_fecha_renovacion (fecha_renovacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

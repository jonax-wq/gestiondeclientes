@echo off
title Flow Stream - Gestion de Clientes
echo ========================================================
echo  Iniciando Flow Stream (Frontend + Servidor IMAP)
echo ========================================================
set "PATH=c:\Users\03331\Documents\MantenimientoEquipos\.node22;%PATH%"

echo 1. Iniciando servicio backend en segundo plano (Puerto 3001)...
start "Flow Stream Backend" /min cmd /c "node server/index.js"

echo 2. Iniciando aplicacion web Vite (Puerto 5180)...
echo.
echo Presiona Ctrl+C en esta ventana para detener.
echo.
npm --prefix client run dev

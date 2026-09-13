@echo off
title CalculadorasIngenieria - vincular con GitHub
cd /d "%~dp0"

echo.
echo   ==================================================================
echo    CalculadorasIngenieria - vinculacion con GitHub
echo   ==================================================================
echo.
echo   Desbloqueando el script...
echo   (Windows marca como no confiables los archivos que llegan de afuera)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -LiteralPath '%~dp0vincular-github.ps1' -ErrorAction SilentlyContinue"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0vincular-github.ps1"

echo.
echo   ------------------------------------------------------------------
echo    Fin del script.
echo.
echo    Esta ventana queda abierta a proposito. Si arriba aparece algun
echo    error, copialo y pegalo en el chat.
echo   ------------------------------------------------------------------
echo.
pause

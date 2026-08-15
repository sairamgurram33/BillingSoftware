@echo off
REM SmartShop POS - Quick Start Script
REM This script will start both backend and frontend

color 0A
cls
echo.
echo ================================================================================
echo   *** SMARTSHOP POS - BILLING SOFTWARE ***
echo ================================================================================
echo.
echo Starting application...
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Login with:
echo   Username: admin
echo   Password: admin123
echo.
echo Press CTRL+C to stop the server
echo ================================================================================
echo.

cd /d "%~dp0"
npm start

pause

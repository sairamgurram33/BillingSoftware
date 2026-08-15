@echo off
REM SmartShop POS - Database Setup Script
REM This script sets up MySQL database with sample data

color 0A
cls
echo.
echo ================================================================================
echo   *** SMARTSHOP POS - DATABASE SETUP ***
echo ================================================================================
echo.
echo This script will:
echo   1. Create database schema
echo   2. Insert sample data (32 bills from last 3 months)
echo   3. Load 10 products
echo   4. Load 6 customers
echo.
echo Prerequisites:
echo   - MySQL installed and running
echo   - Root password configured (set in environment)
echo.
echo ================================================================================
echo.

REM Check if MySQL is available
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: MySQL is not installed or not in PATH
    echo Download from: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

echo Creating database and tables...
mysql -u root -p"%DB_PASSWORD%" < database\schema.sql
if errorlevel 1 (
    echo ERROR: Failed to create database schema
    pause
    exit /b 1
)

echo.
echo Inserting sample data...
mysql -u root -p"%DB_PASSWORD%" smartshop_pos < database\sample-data.sql
if errorlevel 1 (
    echo ERROR: Failed to insert sample data
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo   *** DATABASE SETUP COMPLETE ***
echo ================================================================================
echo.
echo Database: smartshop_pos
echo Tables: 5 (products, bills, billItems, customers, users)
echo Sample Bills: 32 (May-July 2026)
echo Sample Products: 10
echo Sample Customers: 6
echo.
echo Next step: Run "npm start" to start the application
echo.
pause

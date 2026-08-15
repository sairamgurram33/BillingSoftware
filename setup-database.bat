@echo off
REM SmartShop POS - MySQL Database Setup

color 0A
cls
echo.
echo ============================================================
echo   SMARTSHOP POS - DATABASE SETUP
echo ============================================================
echo.
echo This script will:
echo   1. Create database: smartshop_pos
echo   2. Create all tables
echo   3. Add 5 sample products
echo   4. Setup user accounts
echo.
echo Password: Set in environment variable DB_PASSWORD
echo.
echo ============================================================
echo.

REM Check if MySQL is available
mysql --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: MySQL command not found in PATH
    echo.
    echo You need to:
    echo   1. Open MySQL Workbench
    echo   2. Double-click: Local instance MySQL80
    echo   3. Password: (set in your DB_PASSWORD environment variable)
    echo   4. File - Open SQL Script
    echo   5. Select: database\schema.sql
    echo   6. Click Execute
    echo.
    echo Then run this script again, or continue with npm start
    echo.
    pause
    exit /b 1
)

echo Creating database and tables...
mysql -u root -p"%DB_PASSWORD%" < database\schema.sql
if errorlevel 1 (
    echo Error creating database
    pause
    exit /b 1
)
echo Database created successfully!

echo.
echo Adding sample products...
mysql -u root -p"%DB_PASSWORD%" smartshop_pos -e "INSERT INTO products (id, productName, productCode, category, purchasePrice, sellingPrice, currentStock, gstPercentage) VALUES ('prod-1', 'PVC Pipe 2 inch', 'PIPE-001', 'Pipes', 150, 250, 100, 12), ('prod-2', 'Cement 50kg', 'CEMENT-001', 'Cement', 400, 550, 100, 5), ('prod-3', 'Hammer', 'TOOL-001', 'Tools', 200, 350, 50, 18), ('prod-4', 'Screwdriver Set', 'TOOL-002', 'Tools', 300, 500, 50, 18), ('prod-5', 'Paint (1L)', 'PAINT-001', 'Paint', 400, 650, 50, 0);"
if errorlevel 1 (
    echo Error adding products
    pause
    exit /b 1
)
echo Products added successfully!

echo.
echo Verifying database...
echo.
mysql -u root -p"%DB_PASSWORD%" smartshop_pos -e "SELECT COUNT(*) as 'Total Products' FROM products; SELECT COUNT(*) as 'Total Users' FROM users; SELECT COUNT(*) as 'Total Bills' FROM bills;"

echo.
echo ============================================================
echo   DATABASE SETUP COMPLETE!
echo ============================================================
echo.
echo Next steps:
echo   1. npm start
echo   2. Login: admin / admin123
echo   3. Create your first bill!
echo.
echo ============================================================
echo.
pause

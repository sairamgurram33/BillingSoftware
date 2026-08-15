# MySQL Database Setup Script
# This script sets up the SmartShop POS database

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        SMARTSHOP POS - DATABASE SETUP                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Check if MySQL Workbench is installed
Write-Host "Step 1: Checking MySQL installation..." -ForegroundColor Yellow

$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if ($null -eq $mysqlPath) {
    Write-Host "⚠️  MySQL command line not found in PATH" -ForegroundColor Red
    Write-Host "But MySQL Workbench is installed! Follow these manual steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open MySQL Workbench" -ForegroundColor Cyan
    Write-Host "2. Double-click: Local instance MySQL80" -ForegroundColor Cyan
    Write-Host "3. Password: (set in your DB_PASSWORD environment variable)" -ForegroundColor Cyan
    Write-Host "4. File → Open SQL Script" -ForegroundColor Cyan
    Write-Host "5. Select: database\schema.sql" -ForegroundColor Cyan
    Write-Host "6. Click Execute (⚡)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After that, create a new query and run:" -ForegroundColor Cyan
    Write-Host ""
    
    $sqlScript = @"
INSERT INTO smartshop_pos.products (id, productName, productCode, category, purchasePrice, sellingPrice, currentStock, gstPercentage) VALUES
('prod-1', 'PVC Pipe 2 inch', 'PIPE-001', 'Pipes', 150, 250, 100, 12),
('prod-2', 'Cement 50kg', 'CEMENT-001', 'Cement', 400, 550, 100, 5),
('prod-3', 'Hammer', 'TOOL-001', 'Tools', 200, 350, 50, 18),
('prod-4', 'Screwdriver Set', 'TOOL-002', 'Tools', 300, 500, 50, 18),
('prod-5', 'Paint (1L)', 'PAINT-001', 'Paint', 400, 650, 50, 0);
"@
    
    Write-Host $sqlScript -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then verify with:" -ForegroundColor Cyan
    Write-Host "SELECT COUNT(*) FROM smartshop_pos.products;" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After setup, restart the app with: npm start" -ForegroundColor Green
    exit
}

Write-Host "✅ MySQL found at: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Creating database and tables..." -ForegroundColor Yellow

$schemaFile = "database\schema.sql"
if (-not (Test-Path $schemaFile)) {
    Write-Host "❌ Error: $schemaFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "Running schema.sql..." -ForegroundColor Cyan
& mysql -u root -p"$env:DB_PASSWORD" < $schemaFile 2>&1 | Select-String -Pattern "Query|Error" | ForEach-Object { Write-Host $_ }

Write-Host ""
Write-Host "Step 3: Adding sample products..." -ForegroundColor Yellow

$productsSQL = @"
INSERT INTO smartshop_pos.products (id, productName, productCode, category, purchasePrice, sellingPrice, currentStock, gstPercentage) VALUES
('prod-1', 'PVC Pipe 2 inch', 'PIPE-001', 'Pipes', 150, 250, 100, 12),
('prod-2', 'Cement 50kg', 'CEMENT-001', 'Cement', 400, 550, 100, 5),
('prod-3', 'Hammer', 'TOOL-001', 'Tools', 200, 350, 50, 18),
('prod-4', 'Screwdriver Set', 'TOOL-002', 'Tools', 300, 500, 50, 18),
('prod-5', 'Paint (1L)', 'PAINT-001', 'Paint', 400, 650, 50, 0);
"@

$productsSQL | & mysql -u root -p"$env:DB_PASSWORD" smartshop_pos 2>&1 | Select-String -Pattern "affected|Error" | ForEach-Object { Write-Host $_ }

Write-Host ""
Write-Host "Step 4: Verifying database..." -ForegroundColor Yellow

$verifySQL = @"
SELECT COUNT(*) as 'Total Products' FROM smartshop_pos.products;
SELECT COUNT(*) as 'Total Users' FROM smartshop_pos.users;
SELECT COUNT(*) as 'Total Bills' FROM smartshop_pos.bills;
"@

$verifySQL | & mysql -u root -p"$env:DB_PASSWORD" smartshop_pos 2>&1 | ForEach-Object { Write-Host $_ -ForegroundColor Green }

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ DATABASE SETUP COMPLETE!                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. npm start" -ForegroundColor White
Write-Host "2. Login: admin / admin123" -ForegroundColor White
Write-Host "3. Start creating bills!" -ForegroundColor White
Write-Host ""

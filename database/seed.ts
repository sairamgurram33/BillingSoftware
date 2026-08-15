import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();

  // Create roles
  const adminPermissions = [
    'CREATE_PRODUCT',
    'EDIT_PRODUCT',
    'DELETE_PRODUCT',
    'CREATE_CATEGORY',
    'EDIT_CATEGORY',
    'DELETE_CATEGORY',
    'CREATE_USER',
    'EDIT_USER',
    'DELETE_USER',
    'VIEW_REPORTS',
    'MANAGE_SETTINGS',
    'MANAGE_PRINTER',
    'BACKUP_DATABASE',
    'RESTORE_DATABASE',
    'VIEW_AUDIT_LOG',
  ];

  const cashierPermissions = [
    'CREATE_BILL',
    'SEARCH_PRODUCT',
    'SCAN_BARCODE',
    'CREATE_CUSTOMER',
    'ACCEPT_PAYMENT',
    'PRINT_RECEIPT',
    'REPRINT_RECEIPT',
  ];

  const permissions = await Promise.all([
    ...adminPermissions.map((name) =>
      prisma.permission.create({ data: { name } })
    ),
    ...cashierPermissions.map((name) =>
      prisma.permission.create({ data: { name } })
    ),
  ]);

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Administrator with full access',
      permissions: {
        connect: permissions.filter((p) =>
          adminPermissions.includes(p.name)
        ),
      },
    },
  });

  const cashierRole = await prisma.role.create({
    data: {
      name: 'CASHIER',
      description: 'Cashier with limited access',
      permissions: {
        connect: permissions.filter((p) =>
          cashierPermissions.includes(p.name)
        ),
      },
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@smartshop.com',
      phone: '9876543210',
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });

  // Create cashier user
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  await prisma.user.create({
    data: {
      username: 'cashier',
      passwordHash: cashierPassword,
      firstName: 'Cashier',
      lastName: 'User',
      email: 'cashier@smartshop.com',
      phone: '9876543211',
      roleId: cashierRole.id,
      status: 'ACTIVE',
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Building Materials',
        slug: 'building-materials',
        icon: '🏗️',
        color: '#FF6B6B',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Electrical',
        slug: 'electrical',
        icon: '⚡',
        color: '#4ECDC4',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Hardware',
        slug: 'hardware',
        icon: '🔧',
        color: '#45B7D1',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Paint & Coating',
        slug: 'paint-coating',
        icon: '🎨',
        color: '#F7B731',
      },
    }),
  ]);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Cement Corp',
        email: 'contact@cementcorp.com',
        phone: '8765432100',
        address: '123 Industrial Ave',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Pipe Industries Ltd',
        email: 'contact@pipeindustries.com',
        phone: '8765432101',
        address: '456 Trade Street',
        city: 'Delhi',
        state: 'Delhi',
        pinCode: '110001',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Hardware Wholesale',
        email: 'contact@hardwarewholesale.com',
        phone: '8765432102',
        address: '789 Market Lane',
        city: 'Bangalore',
        state: 'Karnataka',
        pinCode: '560001',
      },
    }),
  ]);

  // Create products (Hardware shop sample data)
  const products = await Promise.all([
    // Cement
    prisma.product.create({
      data: {
        productName: 'Portland Cement - 50kg',
        productCode: 'CEMENT-001',
        sku: 'SKU-CEMENT-50',
        barcode: '9876543210001',
        categoryId: categories[0].id,
        brand: 'Ambuja',
        unit: 'BAG',
        purchasePrice: 300.0,
        sellingPrice: 350.0,
        mrp: 380.0,
        gstPercentage: 5,
        openingStock: 100,
        currentStock: 100,
        minimumStock: 20,
        supplierId: suppliers[0].id,
        description: 'High quality Portland cement for construction',
      },
    }),

    // PVC Pipes
    prisma.product.create({
      data: {
        productName: 'PVC Pipe - 1 inch',
        productCode: 'PVC-001',
        sku: 'SKU-PVC-1',
        barcode: '9876543210002',
        categoryId: categories[0].id,
        brand: 'Ashirvad',
        unit: 'METER',
        purchasePrice: 45.0,
        sellingPrice: 55.0,
        mrp: 65.0,
        gstPercentage: 12,
        openingStock: 500,
        currentStock: 500,
        minimumStock: 50,
        supplierId: suppliers[1].id,
        description: '1 inch PVC pipe for water supply',
      },
    }),

    prisma.product.create({
      data: {
        productName: 'PVC Pipe - 2 inch',
        productCode: 'PVC-002',
        sku: 'SKU-PVC-2',
        barcode: '9876543210003',
        categoryId: categories[0].id,
        brand: 'Ashirvad',
        unit: 'METER',
        purchasePrice: 80.0,
        sellingPrice: 100.0,
        mrp: 120.0,
        gstPercentage: 12,
        openingStock: 300,
        currentStock: 300,
        minimumStock: 30,
        supplierId: suppliers[1].id,
      },
    }),

    // Electrical
    prisma.product.create({
      data: {
        productName: 'Electrical Cable - 2.5 sqmm',
        productCode: 'CABLE-001',
        sku: 'SKU-CABLE-2.5',
        barcode: '9876543210004',
        categoryId: categories[1].id,
        brand: 'Finolex',
        unit: 'METER',
        purchasePrice: 15.0,
        sellingPrice: 18.0,
        mrp: 22.0,
        gstPercentage: 18,
        openingStock: 1000,
        currentStock: 1000,
        minimumStock: 100,
        supplierId: suppliers[2].id,
      },
    }),

    // Hardware tools
    prisma.product.create({
      data: {
        productName: 'Hammer - Claw Type',
        productCode: 'HAM-001',
        sku: 'SKU-HAMMER',
        barcode: '9876543210005',
        categoryId: categories[2].id,
        brand: 'Stanley',
        unit: 'PIECE',
        purchasePrice: 200.0,
        sellingPrice: 250.0,
        mrp: 299.0,
        gstPercentage: 18,
        openingStock: 50,
        currentStock: 50,
        minimumStock: 10,
        supplierId: suppliers[2].id,
      },
    }),

    prisma.product.create({
      data: {
        productName: 'Screwdriver Set - 6pc',
        productCode: 'SD-001',
        sku: 'SKU-SD-SET',
        barcode: '9876543210006',
        categoryId: categories[2].id,
        brand: 'Stanley',
        unit: 'SET',
        purchasePrice: 150.0,
        sellingPrice: 200.0,
        mrp: 249.0,
        gstPercentage: 18,
        openingStock: 30,
        currentStock: 30,
        minimumStock: 5,
        supplierId: suppliers[2].id,
      },
    }),

    // Paint
    prisma.product.create({
      data: {
        productName: 'Emulsion Paint - 1L',
        productCode: 'PAINT-001',
        sku: 'SKU-PAINT-1L',
        barcode: '9876543210007',
        categoryId: categories[3].id,
        brand: 'Asian Paints',
        unit: 'LITER',
        purchasePrice: 250.0,
        sellingPrice: 350.0,
        mrp: 399.0,
        gstPercentage: 28,
        openingStock: 100,
        currentStock: 100,
        minimumStock: 10,
        supplierId: suppliers[2].id,
      },
    }),

    prisma.product.create({
      data: {
        productName: 'Enamel Paint - 1L',
        productCode: 'PAINT-002',
        sku: 'SKU-ENAMEL-1L',
        barcode: '9876543210008',
        categoryId: categories[3].id,
        brand: 'Berger',
        unit: 'LITER',
        purchasePrice: 300.0,
        sellingPrice: 420.0,
        mrp: 499.0,
        gstPercentage: 28,
        openingStock: 80,
        currentStock: 80,
        minimumStock: 10,
        supplierId: suppliers[2].id,
      },
    }),

    // Fasteners
    prisma.product.create({
      data: {
        productName: 'Screw Box - 1kg',
        productCode: 'SCREW-001',
        sku: 'SKU-SCREW-1KG',
        barcode: '9876543210009',
        categoryId: categories[2].id,
        brand: 'Vikrant',
        unit: 'KG',
        purchasePrice: 100.0,
        sellingPrice: 120.0,
        mrp: 149.0,
        gstPercentage: 18,
        openingStock: 200,
        currentStock: 200,
        minimumStock: 20,
        supplierId: suppliers[2].id,
      },
    }),

    prisma.product.create({
      data: {
        productName: 'Nut & Bolt Set',
        productCode: 'NB-001',
        sku: 'SKU-NB-SET',
        barcode: '9876543210010',
        categoryId: categories[2].id,
        brand: 'Vikrant',
        unit: 'SET',
        purchasePrice: 80.0,
        sellingPrice: 100.0,
        mrp: 129.0,
        gstPercentage: 18,
        openingStock: 150,
        currentStock: 150,
        minimumStock: 15,
        supplierId: suppliers[2].id,
      },
    }),
  ]);

  // Create customers
  await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Rajesh Kumar',
        phone: '9876543210',
        email: 'rajesh@example.com',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Priya Singh',
        phone: '9876543211',
        email: 'priya@example.com',
        address: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pinCode: '110001',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Amit Patel',
        phone: '9876543212',
        email: 'amit@example.com',
        address: '789 Market Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pinCode: '560001',
      },
    }),
  ]);

  // Create shop settings
  await prisma.shopSettings.create({
    data: {
      shopName: 'SmartShop Hardware Store',
      address: '123 Hardware Lane, Business District',
      phone: '9876543210',
      email: 'contact@smartshop.com',
      gstNumber: 'GST123456789',
      footerText: 'Thank you for your purchase!\nVisit us again!',
      enableGST: true,
      enableDiscount: true,
      enableCredit: true,
      currencySymbol: '₹',
    },
  });

  // Create printer settings
  await prisma.printerSettings.create({
    data: {
      printerName: 'Default Printer',
      paperWidth: 80,
      autoprint: false,
      numberOfCopies: 1,
      fontSize: 1,
      showQR: true,
      showBarcode: true,
      showGST: true,
      showDiscount: true,
      showCustomer: true,
      showPhone: true,
      showPayment: true,
    },
  });

  // Create receipt settings
  await prisma.receiptSettings.create({
    data: {
      billNumberPrefix: 'BIL',
      showItemCode: true,
      showGSTBreakup: true,
      headerText: 'SmartShop Hardware Store',
      footerText: 'Thank you for your purchase!',
    },
  });

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

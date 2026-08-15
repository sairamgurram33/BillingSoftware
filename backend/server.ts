import express, { Express, Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ==================== MYSQL CONNECTION ====================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartshop_pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================== DATABASE INITIALIZATION ====================
// Initialize database tables on startup
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'smartshop_pos'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'smartshop_pos'}`);

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        productName VARCHAR(255) NOT NULL,
        productCode VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(100),
        purchasePrice DECIMAL(10, 2),
        sellingPrice DECIMAL(10, 2) NOT NULL,
        currentStock INT NOT NULL DEFAULT 0,
        gstPercentage DECIMAL(5, 2) DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'piece',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_productCode (productCode),
        INDEX idx_productName (productName),
        INDEX idx_isActive (isActive)
      )
    `);

    // Add missing columns to existing products table (migration)
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT 'piece'`);
    } catch (err: any) {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    }

    try {
      await connection.query(`ALTER TABLE products ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE`);
    } catch (err: any) {
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    };

    // Create customers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_name (name)
      )
    `);

    // Create bills table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id VARCHAR(36) PRIMARY KEY,
        billNumber VARCHAR(50) UNIQUE NOT NULL,
        customerId VARCHAR(36),
        subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
        discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        gst DECIMAL(12, 2) NOT NULL DEFAULT 0,
        totalAmount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        paymentStatus VARCHAR(50) DEFAULT 'COMPLETED',
        paymentMethod VARCHAR(50) DEFAULT 'CASH',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL,
        INDEX idx_billNumber (billNumber),
        INDEX idx_createdAt (createdAt),
        INDEX idx_customerId (customerId),
        INDEX idx_paymentStatus (paymentStatus)
      )
    `);

    // Create billItems table (CRITICAL TABLE)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS billItems (
        id VARCHAR(36) PRIMARY KEY,
        billId VARCHAR(36) NOT NULL,
        productId VARCHAR(36) NOT NULL,
        productName VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        gst DECIMAL(12, 2) NOT NULL DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_billItems_bill FOREIGN KEY (billId) REFERENCES bills(id) ON DELETE CASCADE,
        CONSTRAINT fk_billItems_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT,
        INDEX idx_billId (billId),
        INDEX idx_productId (productId)
      )
    `);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'cashier',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      )
    `);

    console.log('✅ Database tables initialized successfully!');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  } finally {
    connection.release();
  }
}

// Test connection and initialize database
pool.getConnection()
  .then(async connection => {
    console.log('✅ MySQL Connected Successfully!');
    connection.release();
    
    // Initialize database tables
    await initializeDatabase();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Error:', err.message);
    process.exit(1);
  });

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// Authentication Middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== ROUTES ====================

// Health Check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      mode: 'MySQL Database Connected',
      database: process.env.DB_NAME
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed' 
    });
  }
});

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    console.log(`Login attempt: ${username}`);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Query user from database
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Compare password
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      console.log(`Wrong password for user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Login successful: ${username}`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const [rows]: any = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// ==================== PRODUCT ROUTES ====================

app.get('/api/products', authenticate, async (req: Request, res: Response) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE isActive = TRUE ORDER BY productName');
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', authenticate, async (req: Request, res: Response) => {
  try {
    const { productName, productCode, category, purchasePrice, sellingPrice, currentStock, gstPercentage, unit } = req.body;

    if (!productName || !productCode) {
      return res.status(400).json({ error: 'Product name and code required' });
    }

    const id = uuidv4();

    await pool.query(
      `INSERT INTO products (id, productName, productCode, category, purchasePrice, sellingPrice, currentStock, gstPercentage, unit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, productName, productCode, category || 'General', purchasePrice || 0, sellingPrice || 0, currentStock || 0, gstPercentage || 0, unit || 'piece']
    );

    const [rows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json({ product: rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productName, productCode, category, purchasePrice, sellingPrice, currentStock, gstPercentage, unit } = req.body;

    const [result]: any = await pool.query(
      `UPDATE products SET productName = ?, productCode = ?, category = ?, purchasePrice = ?, sellingPrice = ?, currentStock = ?, gstPercentage = ?, unit = ? WHERE id = ?`,
      [productName, productCode, category, purchasePrice, sellingPrice, currentStock, gstPercentage, unit || 'piece', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [rows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ product: rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticate, async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    // Products are never physically deleted because existing bills
    // may reference them through the billItems foreign key.
    // Instead, mark the product as inactive (soft delete).
    const [result]: any = await connection.query(
      'UPDATE products SET isActive = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      // The product may already be inactive. Check whether it exists.
      const [products]: any = await connection.query(
        'SELECT id FROM products WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
    }

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Failed to delete product'
    });
  } finally {
    connection.release();
  }
});

// ==================== CUSTOMER ROUTES ====================

app.get('/api/customers', authenticate, async (req: Request, res: Response) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone required' });
    }

    const id = uuidv4();

    await pool.query(
      'INSERT INTO customers (id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [id, name, phone, email || '', address || '']
    );

    const [rows]: any = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json({ customer: rows[0] });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// ==================== SALES/BILLING ROUTES ====================

app.post('/api/sales', authenticate, async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { items, discount = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in bill' });
    }

    await connection.beginTransaction();

    let subtotal = 0;
    const processedItems = [];
    let gstTotal = 0;

    // Process each item
    for (const item of items) {
      const [productRows]: any = await connection.query(
        'SELECT * FROM products WHERE id = ?',
        [item.productId]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      const product = productRows[0];

      if (product.currentStock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${product.productName}` });
      }

      const itemAmount = product.sellingPrice * item.quantity;
      const itemGst = (itemAmount * product.gstPercentage) / 100;

      processedItems.push({
        id: uuidv4(),
        productId: product.id,
        productName: product.productName,
        quantity: item.quantity,
        price: product.sellingPrice,
        amount: itemAmount,
        gst: itemGst,
      });

      subtotal += itemAmount;
      gstTotal += itemGst;

      // Update stock
      await connection.query(
        'UPDATE products SET currentStock = currentStock - ? WHERE id = ?',
        [item.quantity, product.id]
      );
    }

    const discountAmount = parseFloat(discount) || 0;
    const totalAmount = subtotal + gstTotal - discountAmount;

    const billDate = new Date();
    const dateStr = `${billDate.getFullYear()}${String(billDate.getMonth() + 1).padStart(2, '0')}${String(billDate.getDate()).padStart(2, '0')}`;
    
    // Get the count of bills created today to generate sequential number
    const [countRows]: any = await connection.query(
      `SELECT COUNT(*) as count FROM bills WHERE DATE(createdAt) = CURDATE()`
    );
    const billCounter = (countRows[0].count + 1).toString().padStart(4, '0');
    const billNumber = `BIL-${dateStr}-${billCounter}`;
    const billId = uuidv4();

    // Insert bill
    await connection.query(
      `INSERT INTO bills (id, billNumber, subtotal, discount, gst, totalAmount, paymentStatus, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [billId, billNumber, subtotal, discountAmount, gstTotal, totalAmount, 'COMPLETED', billDate]
    );

    // Insert bill items
    for (const item of processedItems) {
      await connection.query(
        `INSERT INTO billItems (id, billId, productId, productName, quantity, price, amount, gst) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, billId, item.productId, item.productName, item.quantity, item.price, item.amount, item.gst]
      );
    }

    await connection.commit();

    console.log(`✅ Bill created: ${billNumber} - Total: ₹${totalAmount}`);

    res.status(201).json({
      message: 'Bill created successfully',
      bill: {
        id: billId,
        billNumber,
        subtotal,
        discount: discountAmount,
        gst: gstTotal,
        totalAmount,
        items: processedItems,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  } finally {
    connection.release();
  }
});

app.get('/api/sales', authenticate, async (req: Request, res: Response) => {
  try {
    const [bills]: any = await pool.query(
      'SELECT * FROM bills ORDER BY createdAt DESC'
    );

    // Get items for each bill
    for (const bill of bills) {
      const [items] = await pool.query(
        'SELECT * FROM billItems WHERE billId = ?',
        [bill.id]
      );
      bill.items = items;
    }

    res.json({ sales: bills });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

app.delete('/api/sales/:id', authenticate, async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Get the bill to retrieve items
    const [billRows]: any = await connection.query(
      'SELECT * FROM bills WHERE id = ?',
      [id]
    );

    if (billRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Bill not found' });
    }

    const bill = billRows[0];

    // Get bill items to restore stock
    const [items]: any = await connection.query(
      'SELECT * FROM billItems WHERE billId = ?',
      [id]
    );

    // Restore stock for each item
    for (const item of items) {
      await connection.query(
        'UPDATE products SET currentStock = currentStock + ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    // Delete bill items
    await connection.query('DELETE FROM billItems WHERE billId = ?', [id]);

    // Delete bill
    await connection.query('DELETE FROM bills WHERE id = ?', [id]);

    await connection.commit();

    console.log(`✅ Bill deleted: ${bill.billNumber}`);

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  } finally {
    connection.release();
  }
});

// ==================== REPORTS ROUTES ====================

app.get('/api/reports/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const [billStats]: any = await pool.query(
      'SELECT SUM(totalAmount) as totalSales, COUNT(*) as totalBills FROM bills'
    );

    const [itemStats]: any = await pool.query(
      'SELECT SUM(quantity) as totalItems FROM billItems'
    );

    const [productStats]: any = await pool.query(
      'SELECT COUNT(*) as totalProducts FROM products WHERE isActive = TRUE'
    );

    const [customerStats]: any = await pool.query(
      'SELECT COUNT(*) as totalCustomers FROM customers'
    );

    const [topProducts] = await pool.query(
      'SELECT * FROM products WHERE isActive = TRUE ORDER BY productName LIMIT 5'
    );

    res.json({
      totalSales: billStats[0].totalSales || 0,
      totalBills: billStats[0].totalBills || 0,
      totalItems: itemStats[0].totalItems || 0,
      totalProducts: productStats[0].totalProducts || 0,
      totalCustomers: customerStats[0].totalCustomers || 0,
      topProducts,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   🚀 SmartShop POS Server Started       ║`);
  console.log(`╚══════════════════════════════════════════╝`);
console.log(`📍 Server running on port ${PORT}`);
  console.log(`💾 Database: MySQL (${process.env.DB_NAME})`);
  console.log(`🔐 Login: admin / admin123`);
  console.log(`✨ Bills now save permanently!\n`);
});

export default app;
export { pool };

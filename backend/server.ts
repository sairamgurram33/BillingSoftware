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
const PORT = process.env.SERVER_PORT || 5000;
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

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Connected Successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Error:', err.message);
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
    const [products] = await pool.query('SELECT * FROM products ORDER BY productName');
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
  try {
    const { id } = req.params;
    
    const [result]: any = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
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
      'SELECT COUNT(*) as totalProducts FROM products'
    );

    const [customerStats]: any = await pool.query(
      'SELECT COUNT(*) as totalCustomers FROM customers'
    );

    const [topProducts] = await pool.query(
      'SELECT * FROM products ORDER BY productName LIMIT 5'
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
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   🚀 SmartShop POS Server Started       ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`💾 Database: MySQL (${process.env.DB_NAME})`);
  console.log(`🔐 Login: admin / admin123`);
  console.log(`✨ Bills now save permanently!\n`);
});

export default app;
export { pool };

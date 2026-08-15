import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../server';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        roleId: string;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user role from database - using pool.query instead of prisma
    try {
      const [rows]: any = await pool.query(
        'SELECT roles.name FROM users JOIN roles ON users.roleId = roles.id WHERE users.id = ?',
        [req.user.id]
      );

      if (!rows || rows.length === 0 || !allowedRoles.includes(rows[0].name)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: 'Failed to check authorization' });
    }
  };
}

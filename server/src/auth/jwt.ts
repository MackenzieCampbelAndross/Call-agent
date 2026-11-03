import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'purpledrive-cellular-hr-dialer-jwt-secret-key-2026';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'EMPLOYEE';
  employeeId?: string;
  name: string;
  department?: string;
  registeredPhoneNumber?: string;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

/**
 * Middleware: Requires a valid Bearer token (Admin or Employee)
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  req.user = decoded;
  next();
}

/**
 * Middleware: Enforces Administrator access (Admin or Super Admin only)
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      res.status(403).json({ success: false, error: 'Forbidden: Administrator privileges required' });
      return;
    }
    next();
  });
}

/**
 * Middleware: Enforces Employee access
 */
export function requireEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || !req.user.employeeId) {
      res.status(403).json({ success: false, error: 'Forbidden: Valid employee identity required' });
      return;
    }
    next();
  });
}

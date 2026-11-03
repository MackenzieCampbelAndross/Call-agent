import { Request, Response, NextFunction } from 'express';
export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'EMPLOYEE';
    employeeId?: string;
    name: string;
    department?: string;
    registeredPhoneNumber?: string;
}
export declare function generateToken(payload: AuthTokenPayload): string;
export declare function verifyToken(token: string): AuthTokenPayload | null;
export interface AuthenticatedRequest extends Request {
    user?: AuthTokenPayload;
}
/**
 * Middleware: Requires a valid Bearer token (Admin or Employee)
 */
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Middleware: Enforces Administrator access (Admin or Super Admin only)
 */
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Middleware: Enforces Employee access
 */
export declare function requireEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction): void;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.requireEmployee = requireEmployee;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'purpledrive-cellular-hr-dialer-jwt-secret-key-2026';
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
/**
 * Middleware: Requires a valid Bearer token (Admin or Employee)
 */
function requireAuth(req, res, next) {
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
function requireAdmin(req, res, next) {
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
function requireEmployee(req, res, next) {
    requireAuth(req, res, () => {
        if (!req.user || !req.user.employeeId) {
            res.status(403).json({ success: false, error: 'Forbidden: Valid employee identity required' });
            return;
        }
        next();
    });
}

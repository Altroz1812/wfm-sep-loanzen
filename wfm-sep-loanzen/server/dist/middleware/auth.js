"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const tenantId = req.params.tenant;
        // Verify user exists and is active
        const { data: userData, error: userError } = await connection_1.supabase
            .from('users')
            .select(`
        *,
        tenants!inner(
          id,
          name,
          domain,
          is_active
        )
      `)
            .eq('id', decoded.userId)
            .eq('is_active', true)
            .eq('tenants.is_active', true)
            .single();
        if (userError || !userData) {
            res.status(401).json({ error: 'Invalid user or inactive account' });
            return;
        }
        // Verify tenant access
        if (userData.tenant_id !== tenantId && tenantId !== userData.tenants.domain.split('.')[0]) {
            res.status(403).json({ error: 'Access denied to this tenant' });
            return;
        }
        req.user = {
            id: userData.id,
            tenantId: userData.tenant_id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            isActive: userData.is_active,
            createdAt: userData.created_at,
            updatedAt: userData.updated_at
        };
        req.tenant = {
            id: userData.tenant_id,
            name: userData.tenants.name,
            domain: userData.tenants.domain,
            isActive: userData.tenants.is_active,
            settings: {},
            createdAt: userData.created_at,
            updatedAt: userData.updated_at
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=auth.js.map
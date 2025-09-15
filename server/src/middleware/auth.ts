import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { supabase } from '../database/connection';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const tenantId = req.params.tenant;

    // Verify user exists and is active
    const { data: userData, error: userError } = await supabase
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
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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
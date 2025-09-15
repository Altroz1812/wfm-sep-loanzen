import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../database/connection';
import { config } from '../config';
import { logger } from '../utils/logger';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user with tenant information
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
        .eq('email', email)
        .eq('is_active', true)
        .eq('tenants.is_active', true)
        .single();

      if (userError || !userData) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: userData.id, tenantId: userData.tenant_id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        token,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          tenant: {
            id: userData.tenant_id,
            name: userData.tenants.name,
            domain: userData.tenants.domain
          }
        }
      });

      logger.info(`User ${email} logged in successfully`);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role, tenantId } = req.body;

      if (!email || !password || !name || !role) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          name,
          role,
          tenant_id: tenantId
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          tenantId: newUser.tenant_id,
          createdAt: newUser.created_at
        }
      });

      logger.info(`New user registered: ${email}`);
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize Supabase client only if credentials are properly configured
let supabase: any = null;

const initializeSupabase = () => {
  // Check if we have valid Supabase credentials
  if (!config.supabase.url || 
      config.supabase.url.includes('your-project') || 
      config.supabase.url === 'https://your-project.supabase.co' ||
      !config.supabase.serviceRoleKey || 
      config.supabase.serviceRoleKey.includes('your-service-role-key') ||
      config.supabase.serviceRoleKey === 'your-service-role-key') {
    logger.warn('Supabase credentials not configured. Running in mock mode.');
    return null;
  }

  try {
    return createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

supabase = initializeSupabase();

// Mock pool for StackBlitz environment (since Docker/PostgreSQL isn't available)
export const pool = {
  query: async (text: string, params?: any[]) => {
    logger.warn('Mock database query (StackBlitz mode):', { text, params });
    
    // Return mock data based on query type
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }] };
    }
    
    if (text.includes('FROM users') && text.includes('WHERE email')) {
      // Mock user login query
      const email = params?.[0];
      if (email === 'admin@demo.com') {
        return {
          rows: [{
            id: '550e8400-e29b-41d4-a716-446655440001',
            tenant_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'admin@demo.com',
            password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
            name: 'System Admin',
            role: 'Admin',
            is_active: true,
            tenants: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Demo Bank',
              domain: 'demo.lendingbank.com',
              is_active: true
            }
          }]
        };
      }
    }
    
    // Default empty result
    return { rows: [] };
  },
  connect: async () => ({
    query: pool.query,
    release: () => {}
  }),
  end: () => {}
};

export { supabase };

export const connectDatabase = async (): Promise<void> => {
  try {
    logger.info('Running in StackBlitz mode - using mock database');
    
    if (!supabase) {
      logger.warn('Supabase not initialized. Running in full mock mode.');
      logger.info('To use real database, please set up Supabase credentials in server/.env');
      return;
    }

    // Test Supabase connection
    const { data, error } = await supabase.from('tenants').select('count').limit(1);
    
    if (error) {
      logger.warn('Supabase connection failed, continuing in mock mode:', error.message);
      return;
    }
    
    logger.info('Supabase connection established');
  } catch (error) {
    logger.warn('Database connection failed, running in mock mode:', error);
  }
};

// Graceful shutdown (no-op in StackBlitz)
process.on('SIGINT', () => {
  logger.info('Database connections closed');
});

process.on('SIGTERM', () => {
  logger.info('Database connections closed');
});
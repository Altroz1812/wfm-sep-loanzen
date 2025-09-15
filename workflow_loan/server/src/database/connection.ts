import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize Supabase client only if credentials are properly configured
let supabase: any = null;

// Initialize PostgreSQL connection pool
export const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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

export { supabase };

export const connectDatabase = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('PostgreSQL connection established');

    if (!supabase) {
      logger.warn('Supabase not initialized. Running in mock mode.');
      return;
    }

    // Test connection by making a simple query
    const { data, error } = await supabase.from('tenants').select('count').limit(1);
    
    if (error) {
      logger.warn('Supabase connection failed, continuing in mock mode:', error.message);
      return;
    }
    
    logger.info('Supabase connection established');
  } catch (error) {
    logger.warn('Failed to connect to database:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end();
  logger.info('Supabase client closed');
});

process.on('SIGTERM', () => {
  pool.end();
  logger.info('Supabase client closed');
});
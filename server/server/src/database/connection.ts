import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

// PostgreSQL pool (optional if you only use Supabase)
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

// Supabase client
export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const connectDatabase = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('PostgreSQL connection established');
    } catch (err) {
      logger.warn('PostgreSQL connection skipped or failed', { err });
    }

    // Test Supabase connection with a lightweight system query
    const { error } = await supabase.from('pg_tables').select('tablename').limit(1);

    if (error) {
      logger.warn('Supabase connection test failed', { error });
    } else {
      logger.info('Supabase connected successfully');
    }
  } catch (error) {
    logger.error('No database connection could be established', { error });
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end();
  logger.info('PostgreSQL pool closed');
});

process.on('SIGTERM', () => {
  pool.end();
  logger.info('PostgreSQL pool closed');
});

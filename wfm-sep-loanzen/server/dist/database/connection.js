"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = exports.supabase = exports.pool = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const pg_1 = require("pg");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Initialize Supabase client only if credentials are properly configured
let supabase = null;
exports.supabase = supabase;
// Initialize PostgreSQL connection pool
exports.pool = new pg_1.Pool({
    user: config_1.config.db.user,
    host: config_1.config.db.host,
    database: config_1.config.db.database,
    password: config_1.config.db.password,
    port: config_1.config.db.port,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
const initializeSupabase = () => {
    // Check if we have valid Supabase credentials
    if (!config_1.config.supabase.url ||
        config_1.config.supabase.url.includes('your-project') ||
        config_1.config.supabase.url === 'https://your-project.supabase.co' ||
        !config_1.config.supabase.serviceRoleKey ||
        config_1.config.supabase.serviceRoleKey.includes('your-service-role-key') ||
        config_1.config.supabase.serviceRoleKey === 'your-service-role-key') {
        logger_1.logger.warn('Supabase credentials not configured. Running in mock mode.');
        return null;
    }
    try {
        return (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Supabase client:', error);
        return null;
    }
};
exports.supabase = supabase = initializeSupabase();
const connectDatabase = async () => {
    try {
        // Test PostgreSQL connection
        const client = await exports.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger_1.logger.info('PostgreSQL connection established');
        if (!supabase) {
            logger_1.logger.warn('Supabase not initialized. Running in mock mode.');
            return;
        }
        // Test connection by making a simple query
        const { data, error } = await supabase.from('tenants').select('count').limit(1);
        if (error) {
            logger_1.logger.warn('Supabase connection failed, continuing in mock mode:', error.message);
            return;
        }
        logger_1.logger.info('Supabase connection established');
    }
    catch (error) {
        logger_1.logger.warn('Failed to connect to database:', error);
    }
};
exports.connectDatabase = connectDatabase;
// Graceful shutdown
process.on('SIGINT', () => {
    exports.pool.end();
    logger_1.logger.info('Supabase client closed');
});
process.on('SIGTERM', () => {
    exports.pool.end();
    logger_1.logger.info('Supabase client closed');
});
//# sourceMappingURL=connection.js.map
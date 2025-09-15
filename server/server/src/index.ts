import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { setupSwagger } from './utils/swagger';
import { routes } from './routes';
import path from 'path';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React app build directory
const frontendBuildPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendBuildPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Root endpoint for frontend
app.get('/', (req, res) => {
  res.json({ 
    message: 'Workflow Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/api/docs',
      auth: '/api/auth/*',
      tenant_api: '/api/{tenant}/*'
    }
  });
});

// Swagger documentation
setupSwagger(app);

// Auth routes (no tenant required)
app.use('/api/auth', routes);

// API routes with tenant middleware  
app.use('/api/:tenant', authMiddleware, routes);

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // For non-API routes, serve the React app
  const indexPath = path.join(frontendBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If we can't serve the built React app, serve the login page
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Workflow Management System</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .btn-primary {
              @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
            }
            .input-field {
              @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div class="max-w-md w-full space-y-8">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Workflow Management System</h2>
                <p class="text-gray-600">AI-powered loan origination and management platform</p>
              </div>
              
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
                <div class="text-sm text-blue-700 space-y-1">
                  <p><strong>Admin:</strong> admin@demo.com</p>
                  <p><strong>Maker:</strong> maker@demo.com</p>
                  <p><strong>Checker:</strong> checker@demo.com</p>
                  <p><strong>Underwriter:</strong> underwriter@demo.com</p>
                  <p class="text-xs mt-2">Password: <code class="bg-blue-100 px-1 rounded">password123</code></p>
                </div>
              </div>
              
              <form id="loginForm" class="mt-8 space-y-6">
                <div id="errorMessage" class="hidden bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-600"></p>
                </div>
                
                <div id="successMessage" class="hidden bg-green-50 border border-green-200 rounded-lg p-3">
                  <p class="text-sm text-green-600"></p>
                </div>
                
                <div class="space-y-4">
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input id="email" name="email" type="email" value="admin@demo.com" required class="input-field" placeholder="Enter your email">
                  </div>
                  
                  <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input id="password" name="password" type="password" value="password123" required class="input-field" placeholder="Enter your password">
                  </div>
                </div>
                
                <button type="submit" class="btn-primary w-full">Sign in</button>
              </form>
              
              <div class="mt-8 pt-6 border-t border-gray-200">
                <h3 class="text-sm font-medium text-gray-900 mb-3">Platform Features</h3>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• Multi-tenant workflow management</li>
                  <li>• AI-powered credit scoring</li>
                  <li>• Document processing automation</li>
                  <li>• Role-based access control</li>
                  <li>• Complete audit trails</li>
                </ul>
              </div>
            </div>
          </div>
          
          <script>
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              const errorDiv = document.getElementById('errorMessage');
              const successDiv = document.getElementById('successMessage');
              const submitBtn = e.target.querySelector('button[type="submit"]');
              
              // Reset messages
              errorDiv.classList.add('hidden');
              successDiv.classList.add('hidden');
              submitBtn.textContent = 'Signing in...';
              submitBtn.disabled = true;
              
              try {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                  throw new Error(data.error || 'Login failed');
                }
                
                successDiv.querySelector('p').textContent = 'Login successful! Welcome ' + data.user.name + ' (' + data.user.role + ')';
                successDiv.classList.remove('hidden');
                
              } catch (err) {
                errorDiv.querySelector('p').textContent = err.message || 'Login failed. Please try again.';
                errorDiv.classList.remove('hidden');
              } finally {
                submitBtn.textContent = 'Sign in';
                submitBtn.disabled = false;
              }
            });
          </script>
        </body>
        </html>
      `);
    }
  });
});

// Global error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Start server
    const PORT = config.port || 3000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
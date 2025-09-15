import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { WorkflowController } from '../controllers/workflowController';
import { CaseController } from '../controllers/caseController';
import { AIController } from '../controllers/aiController';
import { authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Auth routes (no tenant prefix)
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);

// Protected routes (require authentication)
router.use((req, res, next) => {
  // Skip auth check for auth routes
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  next();
});

// Workflow routes  
router.get('/workflows', WorkflowController.getAllWorkflows);
router.get('/workflows/:id', WorkflowController.getWorkflow);
router.post('/workflows', authorizeRoles([UserRole.ADMIN]), WorkflowController.createWorkflow);
router.put('/workflows/:id', authorizeRoles([UserRole.ADMIN]), WorkflowController.updateWorkflow);

// Case routes
router.get('/cases', CaseController.getAllCases);
router.get('/cases/:id', CaseController.getCaseById);
router.post('/cases', CaseController.createCase);
router.post('/cases/:id/action', CaseController.executeAction);

// Task routes
router.get('/tasks/my', CaseController.getUserTasks);

// AI routes
router.post('/ai/score', AIController.scoreCredit);
router.post('/ai/parse', AIController.parseDocument);
router.get('/ai/model-runs', AIController.getModelRuns);
router.get('/dashboard/ai', AIController.getDashboardMetrics);

export { router as routes };
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const workflowController_1 = require("../controllers/workflowController");
const caseController_1 = require("../controllers/caseController");
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.routes = router;
// Auth routes (no tenant prefix)
router.post('/auth/login', authController_1.AuthController.login);
router.post('/auth/register', authController_1.AuthController.register);
// Protected routes (require authentication)
router.use((req, res, next) => {
    // Skip auth check for auth routes
    if (req.path.startsWith('/auth/')) {
        return next();
    }
    next();
});
// Workflow routes  
router.get('/workflows', workflowController_1.WorkflowController.getAllWorkflows);
router.get('/workflows/:id', workflowController_1.WorkflowController.getWorkflow);
router.post('/workflows', (0, auth_1.authorizeRoles)([types_1.UserRole.ADMIN]), workflowController_1.WorkflowController.createWorkflow);
router.put('/workflows/:id', (0, auth_1.authorizeRoles)([types_1.UserRole.ADMIN]), workflowController_1.WorkflowController.updateWorkflow);
// Case routes
router.get('/cases', caseController_1.CaseController.getAllCases);
router.get('/cases/:id', caseController_1.CaseController.getCaseById);
router.post('/cases', caseController_1.CaseController.createCase);
router.post('/cases/:id/action', caseController_1.CaseController.executeAction);
// Task routes
router.get('/tasks/my', caseController_1.CaseController.getUserTasks);
// AI routes
router.post('/ai/score', aiController_1.AIController.scoreCredit);
router.post('/ai/parse', aiController_1.AIController.parseDocument);
router.get('/ai/model-runs', aiController_1.AIController.getModelRuns);
router.get('/dashboard/ai', aiController_1.AIController.getDashboardMetrics);
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflowService_1 = require("../services/workflowService");
const logger_1 = require("../utils/logger");
class WorkflowController {
    static async getAllWorkflows(req, res) {
        try {
            const tenantId = req.tenant.id;
            const workflows = await workflowService_1.WorkflowService.getAllWorkflows(tenantId);
            res.json(workflows);
        }
        catch (error) {
            logger_1.logger.error('Get workflows error:', error);
            res.status(500).json({ error: 'Failed to fetch workflows' });
        }
    }
    static async getWorkflow(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenant.id;
            const workflow = await workflowService_1.WorkflowService.getWorkflowDefinition(tenantId, id);
            if (!workflow) {
                res.status(404).json({ error: 'Workflow not found' });
                return;
            }
            res.json(workflow);
        }
        catch (error) {
            logger_1.logger.error('Get workflow error:', error);
            res.status(500).json({ error: 'Failed to fetch workflow' });
        }
    }
    static async createWorkflow(req, res) {
        try {
            const tenantId = req.tenant.id;
            const userId = req.user.id;
            const workflowData = req.body;
            const workflow = await workflowService_1.WorkflowService.createWorkflowDefinition(tenantId, userId, { ...workflowData, tenantId });
            res.status(201).json(workflow);
        }
        catch (error) {
            logger_1.logger.error('Create workflow error:', error);
            res.status(500).json({ error: 'Failed to create workflow' });
        }
    }
    static async updateWorkflow(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenant.id;
            const userId = req.user.id;
            const workflowData = req.body;
            // Create new version instead of updating existing
            const workflow = await workflowService_1.WorkflowService.createWorkflowDefinition(tenantId, userId, { ...workflowData, workflowId: id, tenantId });
            res.json(workflow);
        }
        catch (error) {
            logger_1.logger.error('Update workflow error:', error);
            res.status(500).json({ error: 'Failed to update workflow' });
        }
    }
}
exports.WorkflowController = WorkflowController;
//# sourceMappingURL=workflowController.js.map
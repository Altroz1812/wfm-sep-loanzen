import { Response } from 'express';
import { AuthRequest } from '../types';
import { WorkflowService } from '../services/workflowService';
import { logger } from '../utils/logger';

export class WorkflowController {
  static async getAllWorkflows(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const workflows = await WorkflowService.getAllWorkflows(tenantId);
      
      res.json(workflows);
    } catch (error) {
      logger.error('Get workflows error:', error);
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  }

  static async getWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenant!.id;
      
      const workflow = await WorkflowService.getWorkflowDefinition(tenantId, id);
      
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error) {
      logger.error('Get workflow error:', error);
      res.status(500).json({ error: 'Failed to fetch workflow' });
    }
  }

  static async createWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const workflowData = req.body;

      const workflow = await WorkflowService.createWorkflowDefinition(
        tenantId,
        userId,
        { ...workflowData, tenantId }
      );

      res.status(201).json(workflow);
    } catch (error) {
      logger.error('Create workflow error:', error);
      res.status(500).json({ error: 'Failed to create workflow' });
    }
  }

  static async updateWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const workflowData = req.body;

      // Create new version instead of updating existing
      const workflow = await WorkflowService.createWorkflowDefinition(
        tenantId,
        userId,
        { ...workflowData, workflowId: id, tenantId }
      );

      res.json(workflow);
    } catch (error) {
      logger.error('Update workflow error:', error);
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  }
}
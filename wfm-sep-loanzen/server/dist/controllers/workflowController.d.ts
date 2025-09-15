import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class WorkflowController {
    static getAllWorkflows(req: AuthRequest, res: Response): Promise<void>;
    static getWorkflow(req: AuthRequest, res: Response): Promise<void>;
    static createWorkflow(req: AuthRequest, res: Response): Promise<void>;
    static updateWorkflow(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=workflowController.d.ts.map
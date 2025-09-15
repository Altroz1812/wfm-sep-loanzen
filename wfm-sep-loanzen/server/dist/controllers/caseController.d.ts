import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class CaseController {
    static getAllCases(req: AuthRequest, res: Response): Promise<void>;
    static getCaseById(req: AuthRequest, res: Response): Promise<void>;
    static createCase(req: AuthRequest, res: Response): Promise<void>;
    static executeAction(req: AuthRequest, res: Response): Promise<void>;
    static getUserTasks(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=caseController.d.ts.map
import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class AIController {
    static scoreCredit(req: AuthRequest, res: Response): Promise<void>;
    static parseDocument(req: AuthRequest, res: Response): Promise<void>;
    static getModelRuns(req: AuthRequest, res: Response): Promise<void>;
    static getDashboardMetrics(req: AuthRequest, res: Response): Promise<void>;
    private static getTimeFilter;
}
//# sourceMappingURL=aiController.d.ts.map
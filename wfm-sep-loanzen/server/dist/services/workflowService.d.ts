import { WorkflowDefinition, Case } from '../types';
export declare class WorkflowService {
    static getWorkflowDefinition(tenantId: string, workflowId: string, version?: number): Promise<WorkflowDefinition | null>;
    static createWorkflowDefinition(tenantId: string, userId: string, definition: Partial<WorkflowDefinition>): Promise<WorkflowDefinition>;
    static executeTransition(tenantId: string, userId: string, caseId: string, action: string, data?: Record<string, any>): Promise<Case>;
    private static executeAutoRules;
    static getAllWorkflows(tenantId: string): Promise<WorkflowDefinition[]>;
}
//# sourceMappingURL=workflowService.d.ts.map
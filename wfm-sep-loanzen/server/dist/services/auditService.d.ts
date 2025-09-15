import { AuditLog } from '../types';
export declare class AuditService {
    static log(tenantId: string, userId: string, entityType: string, entityId: string, action: string, oldValues?: Record<string, any>, newValues?: Record<string, any>, metadata?: Record<string, any>): Promise<void>;
    static getAuditTrail(tenantId: string, entityType: string, entityId: string, limit?: number): Promise<AuditLog[]>;
}
//# sourceMappingURL=auditService.d.ts.map
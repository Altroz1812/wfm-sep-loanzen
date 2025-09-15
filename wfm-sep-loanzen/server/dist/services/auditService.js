"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class AuditService {
    static async log(tenantId, userId, entityType, entityId, action, oldValues, newValues, metadata) {
        try {
            const { error } = await connection_1.supabase
                .from('audit_logs')
                .insert({
                tenant_id: tenantId,
                entity: entityType,
                entity_id: entityId,
                action,
                old_value: oldValues || null,
                new_value: newValues || null,
                performed_by: userId,
                timestamp: new Date().toISOString()
            });
            if (error) {
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to log audit entry:', error);
            // Don't throw error to avoid breaking main operation
        }
    }
    static async getAuditTrail(tenantId, entityType, entityId, limit = 100) {
        const { data, error } = await connection_1.supabase
            .from('audit_logs')
            .select(`
        *,
        users!inner(
          name,
          email
        )
      `)
            .eq('tenant_id', tenantId)
            .eq('entity', entityType)
            .eq('entity_id', entityId)
            .order('timestamp', { ascending: false })
            .limit(limit);
        if (error) {
            throw error;
        }
        return (data || []).map(row => ({
            id: row.id,
            tenantId: row.tenant_id,
            userId: row.performed_by,
            entityType: row.entity,
            entityId: row.entity_id,
            action: row.action,
            oldValues: row.old_value,
            newValues: row.new_value,
            metadata: {
                ...row.metadata,
                userName: row.users.name,
                userEmail: row.users.email
            },
            timestamp: row.timestamp
        }));
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=auditService.js.map
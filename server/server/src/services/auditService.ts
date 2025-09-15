import { supabase } from '../database/connection';
import { AuditLog } from '../types';
import { logger } from '../utils/logger';

export class AuditService {
  static async log(
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
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
    } catch (error) {
      logger.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  static async getAuditTrail(
    tenantId: string,
    entityType: string,
    entityId: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    const { data, error } = await supabase
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
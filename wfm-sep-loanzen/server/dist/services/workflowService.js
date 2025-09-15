"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const connection_1 = require("../database/connection");
const auditService_1 = require("./auditService");
const aiService_1 = require("./aiService");
const logger_1 = require("../utils/logger");
class WorkflowService {
    static async getWorkflowDefinition(tenantId, workflowId, version) {
        const query = version
            ? 'SELECT * FROM workflow_definitions WHERE tenant_id = $1 AND workflow_id = $2 AND version = $3'
            : 'SELECT * FROM workflow_definitions WHERE tenant_id = $1 AND workflow_id = $2 AND is_active = true ORDER BY version DESC LIMIT 1';
        const params = version ? [tenantId, workflowId, version] : [tenantId, workflowId];
        const result = await connection_1.pool.query(query, params);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            workflowId: row.workflow_id,
            version: row.version,
            tenantId: row.tenant_id,
            name: row.name,
            description: row.description,
            isActive: row.is_active,
            ...row.configuration,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    static async createWorkflowDefinition(tenantId, userId, definition) {
        const client = await connection_1.pool.connect();
        try {
            await client.query('BEGIN');
            // Get next version number
            const versionResult = await client.query('SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM workflow_definitions WHERE tenant_id = $1 AND workflow_id = $2', [tenantId, definition.workflowId]);
            const version = versionResult.rows[0].next_version;
            // Deactivate previous versions if this is set as active
            if (definition.isActive) {
                await client.query('UPDATE workflow_definitions SET is_active = false WHERE tenant_id = $1 AND workflow_id = $2', [tenantId, definition.workflowId]);
            }
            // Insert new workflow definition
            const result = await client.query(`
        INSERT INTO workflow_definitions (workflow_id, version, tenant_id, name, description, is_active, configuration)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
                definition.workflowId,
                version,
                tenantId,
                definition.name,
                definition.description,
                definition.isActive || false,
                JSON.stringify(definition)
            ]);
            await client.query('COMMIT');
            // Log audit entry
            await auditService_1.AuditService.log(tenantId, userId, 'workflow_definition', result.rows[0].id, 'CREATE', undefined, result.rows[0]);
            const row = result.rows[0];
            return {
                workflowId: row.workflow_id,
                version: row.version,
                tenantId: row.tenant_id,
                name: row.name,
                description: row.description,
                isActive: row.is_active,
                ...row.configuration,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async executeTransition(tenantId, userId, caseId, action, data) {
        const client = await connection_1.pool.connect();
        try {
            await client.query('BEGIN');
            // Get current case
            const caseResult = await client.query('SELECT * FROM cases WHERE id = $1 AND tenant_id = $2', [caseId, tenantId]);
            if (caseResult.rows.length === 0) {
                throw new Error('Case not found');
            }
            const currentCase = caseResult.rows[0];
            // Get workflow definition
            const workflow = await this.getWorkflowDefinition(tenantId, currentCase.workflow_id);
            if (!workflow) {
                throw new Error('Workflow definition not found');
            }
            // Find applicable transition
            const transition = workflow.transitions?.find(t => t.from === currentCase.current_stage &&
                t.actions.includes(action));
            if (!transition) {
                throw new Error(`Invalid action '${action}' for current stage '${currentCase.current_stage}'`);
            }
            // Verify user has permission
            const userResult = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
            const userRole = userResult.rows[0]?.role;
            if (!transition.roles.includes(userRole)) {
                throw new Error(`User role '${userRole}' not authorized for this action`);
            }
            // Execute transition
            const newData = { ...currentCase.data, ...data };
            const newStage = transition.to;
            // Update case
            const updatedCaseResult = await client.query(`
        UPDATE cases 
        SET current_stage = $1, data = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `, [newStage, JSON.stringify(newData), caseId, tenantId]);
            const updatedCase = updatedCaseResult.rows[0];
            await client.query('COMMIT');
            // Log audit entry
            await auditService_1.AuditService.log(tenantId, userId, 'case', caseId, `TRANSITION_${action.toUpperCase()}`, { stage: currentCase.current_stage, data: currentCase.data }, { stage: newStage, data: newData }, { transition: transition.id, action });
            // Execute auto rules for new stage
            await this.executeAutoRules(tenantId, caseId, newStage, workflow);
            return {
                id: updatedCase.id,
                tenantId: updatedCase.tenant_id,
                type: updatedCase.type,
                workflowId: updatedCase.workflow_id,
                currentStage: updatedCase.current_stage,
                status: updatedCase.status,
                priority: updatedCase.priority,
                assignedTo: updatedCase.assigned_to,
                createdBy: updatedCase.created_by,
                data: updatedCase.data,
                metadata: updatedCase.metadata,
                createdAt: updatedCase.created_at,
                updatedAt: updatedCase.updated_at
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async executeAutoRules(tenantId, caseId, stage, workflow) {
        const autoRules = workflow.autoRules?.filter(rule => rule.stage === stage && rule.trigger === 'onEnter');
        if (!autoRules || autoRules.length === 0)
            return;
        for (const rule of autoRules) {
            try {
                if (rule.action.startsWith('call:ai/')) {
                    const aiAction = rule.action.replace('call:', '');
                    await aiService_1.AIService.callAIService(tenantId, caseId, aiAction, rule.params);
                }
                logger_1.logger.info(`Executed auto rule ${rule.id} for case ${caseId}`);
            }
            catch (error) {
                logger_1.logger.error(`Failed to execute auto rule ${rule.id}:`, error);
                // Continue with other rules even if one fails
            }
        }
    }
    static async getAllWorkflows(tenantId) {
        const result = await connection_1.pool.query(`
      SELECT * FROM workflow_definitions 
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY name
    `, [tenantId]);
        return result.rows.map(row => ({
            workflowId: row.workflow_id,
            version: row.version,
            tenantId: row.tenant_id,
            name: row.name,
            description: row.description,
            isActive: row.is_active,
            ...row.configuration,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }
}
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=workflowService.js.map
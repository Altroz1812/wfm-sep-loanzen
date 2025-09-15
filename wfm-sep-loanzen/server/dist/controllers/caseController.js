"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseController = void 0;
const connection_1 = require("../database/connection");
const workflowService_1 = require("../services/workflowService");
const auditService_1 = require("../services/auditService");
const logger_1 = require("../utils/logger");
class CaseController {
    static async getAllCases(req, res) {
        try {
            const tenantId = req.tenant.id;
            const { status, assignedTo, type, page = '1', limit = '50' } = req.query;
            let query = `
        SELECT 
          c.*,
          lc.requested_amount,
          lc.tenor,
          lc.decision,
          lc.pd_score,
          lc.borrower_id,
          b.name as borrower_name,
          u.name as assigned_user_name,
          creator.name as created_by_name
        FROM cases c
        LEFT JOIN loan_cases lc ON c.id = lc.loan_id
        LEFT JOIN borrowers b ON lc.borrower_id = b.id
        LEFT JOIN users u ON c.assigned_to = u.id
        LEFT JOIN users creator ON c.created_by = creator.id
        WHERE c.tenant_id = $1
      `;
            const params = [tenantId];
            let paramIndex = 2;
            if (status) {
                query += ` AND c.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }
            if (assignedTo) {
                query += ` AND c.assigned_to = $${paramIndex}`;
                params.push(assignedTo);
                paramIndex++;
            }
            if (type) {
                query += ` AND c.type = $${paramIndex}`;
                params.push(type);
                paramIndex++;
            }
            query += ' ORDER BY c.created_at DESC';
            // Add pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit), offset);
            const result = await connection_1.pool.query(query, params);
            const cases = result.rows.map(row => ({
                id: row.id,
                tenantId: row.tenant_id,
                type: row.type,
                workflowId: row.workflow_id,
                currentStage: row.current_stage,
                status: row.status,
                priority: row.priority,
                assignedTo: row.assigned_to,
                assignedUserName: row.assigned_user_name,
                createdBy: row.created_by,
                createdByName: row.created_by_name,
                data: row.data,
                metadata: row.metadata,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                // Loan-specific fields
                ...(row.type === 'loan' && {
                    loanData: {
                        requestedAmount: row.requested_amount,
                        tenor: row.tenor,
                        decision: row.decision,
                        pdScore: row.pd_score,
                        borrowerId: row.borrower_id,
                        borrowerName: row.borrower_name
                    }
                })
            }));
            res.json(cases);
        }
        catch (error) {
            logger_1.logger.error('Get cases error:', error);
            res.status(500).json({ error: 'Failed to fetch cases' });
        }
    }
    static async getCaseById(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenant.id;
            const result = await connection_1.pool.query(`
        SELECT 
          c.*,
          lc.requested_amount,
          lc.tenor,
          lc.decision,
          lc.pd_score,
          lc.borrower_id,
          b.name as borrower_name,
          b.pan as borrower_pan,
          b.email as borrower_email,
          b.phone as borrower_phone,
          u.name as assigned_user_name,
          creator.name as created_by_name
        FROM cases c
        LEFT JOIN loan_cases lc ON c.id = lc.loan_id
        LEFT JOIN borrowers b ON lc.borrower_id = b.id
        LEFT JOIN users u ON c.assigned_to = u.id
        LEFT JOIN users creator ON c.created_by = creator.id
        WHERE c.id = $1 AND c.tenant_id = $2
      `, [id, tenantId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Case not found' });
                return;
            }
            const row = result.rows[0];
            // Get case documents
            const documentsResult = await connection_1.pool.query('SELECT * FROM documents WHERE case_id = $1 AND tenant_id = $2 ORDER BY created_at DESC', [id, tenantId]);
            // Get case tasks
            const tasksResult = await connection_1.pool.query(`
        SELECT t.*, u.name as assigned_user_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.case_id = $1 AND t.tenant_id = $2
        ORDER BY t.created_at DESC
      `, [id, tenantId]);
            // Get audit trail
            const auditTrail = await auditService_1.AuditService.getAuditTrail(tenantId, 'case', id, 20);
            const caseData = {
                id: row.id,
                tenantId: row.tenant_id,
                type: row.type,
                workflowId: row.workflow_id,
                currentStage: row.current_stage,
                status: row.status,
                priority: row.priority,
                assignedTo: row.assigned_to,
                assignedUserName: row.assigned_user_name,
                createdBy: row.created_by,
                createdByName: row.created_by_name,
                data: row.data,
                metadata: row.metadata,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                documents: documentsResult.rows,
                tasks: tasksResult.rows,
                auditTrail,
                // Loan-specific fields
                ...(row.type === 'loan' && {
                    loanData: {
                        requestedAmount: row.requested_amount,
                        tenor: row.tenor,
                        decision: row.decision,
                        pdScore: row.pd_score,
                        borrower: {
                            id: row.borrower_id,
                            name: row.borrower_name,
                            pan: row.borrower_pan,
                            email: row.borrower_email,
                            phone: row.borrower_phone
                        }
                    }
                })
            };
            res.json(caseData);
        }
        catch (error) {
            logger_1.logger.error('Get case by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch case' });
        }
    }
    static async createCase(req, res) {
        const client = await connection_1.pool.connect();
        try {
            await client.query('BEGIN');
            const tenantId = req.tenant.id;
            const userId = req.user.id;
            const { type = 'generic', workflowId, data, loanData, borrowerData } = req.body;
            // Validate workflow exists
            const workflow = await workflowService_1.WorkflowService.getWorkflowDefinition(tenantId, workflowId);
            if (!workflow) {
                res.status(400).json({ error: 'Invalid workflow ID' });
                return;
            }
            const initialStage = workflow.stages?.[0]?.id || 'draft';
            // Create main case
            const caseResult = await client.query(`
        INSERT INTO cases (tenant_id, type, workflow_id, current_stage, assigned_to, created_by, data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [tenantId, type, workflowId, initialStage, userId, userId, JSON.stringify(data || {})]);
            const newCase = caseResult.rows[0];
            // If it's a loan case, create loan-specific record
            if (type === 'loan' && loanData) {
                let borrowerId = loanData.borrowerId;
                // Create borrower if needed
                if (!borrowerId && borrowerData) {
                    const borrowerResult = await client.query(`
            INSERT INTO borrowers (tenant_id, name, pan, kyc_status, email, phone, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `, [
                        tenantId,
                        borrowerData.name,
                        borrowerData.pan,
                        borrowerData.kycStatus || 'pending',
                        borrowerData.email,
                        borrowerData.phone,
                        borrowerData.address
                    ]);
                    borrowerId = borrowerResult.rows[0].id;
                }
                if (!borrowerId) {
                    throw new Error('Borrower ID is required for loan cases');
                }
                await client.query(`
          INSERT INTO loan_cases (loan_id, tenant_id, borrower_id, product_id, requested_amount, tenor, assigned_to)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
                    newCase.id,
                    tenantId,
                    borrowerId,
                    loanData.productId,
                    loanData.requestedAmount,
                    loanData.tenor,
                    userId
                ]);
            }
            // Create initial task
            await client.query(`
        INSERT INTO tasks (tenant_id, case_id, assigned_to, title, description, type, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
                tenantId,
                newCase.id,
                userId,
                `Complete ${workflow.name}`,
                `Process case through ${workflow.name} workflow`,
                'review',
                newCase.priority || 'medium'
            ]);
            await client.query('COMMIT');
            // Log audit entry
            await auditService_1.AuditService.log(tenantId, userId, 'case', newCase.id, 'CREATE', undefined, newCase);
            res.status(201).json({
                id: newCase.id,
                tenantId: newCase.tenant_id,
                type: newCase.type,
                workflowId: newCase.workflow_id,
                currentStage: newCase.current_stage,
                status: newCase.status,
                priority: newCase.priority,
                assignedTo: newCase.assigned_to,
                createdBy: newCase.created_by,
                data: newCase.data,
                metadata: newCase.metadata,
                createdAt: newCase.created_at,
                updatedAt: newCase.updated_at
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Create case error:', error);
            res.status(500).json({ error: 'Failed to create case' });
        }
        finally {
            client.release();
        }
    }
    static async executeAction(req, res) {
        try {
            const { id } = req.params;
            const { action, data, comment } = req.body;
            const tenantId = req.tenant.id;
            const userId = req.user.id;
            if (!action) {
                res.status(400).json({ error: 'Action is required' });
                return;
            }
            const updatedCase = await workflowService_1.WorkflowService.executeTransition(tenantId, userId, id, action, data);
            // Add comment if provided
            if (comment) {
                await connection_1.pool.query(`
          INSERT INTO case_comments (case_id, user_id, tenant_id, comment, created_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [id, userId, tenantId, comment]);
            }
            res.json(updatedCase);
        }
        catch (error) {
            logger_1.logger.error('Execute action error:', error);
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to execute action' });
            }
        }
    }
    static async getUserTasks(req, res) {
        try {
            const tenantId = req.tenant.id;
            const userId = req.user.id;
            const { status = 'pending', page = '1', limit = '20' } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const result = await connection_1.pool.query(`
        SELECT 
          t.*,
          c.workflow_id,
          c.current_stage,
          c.type as case_type,
          lc.requested_amount,
          b.name as borrower_name
        FROM tasks t
        JOIN cases c ON t.case_id = c.id
        LEFT JOIN loan_cases lc ON c.id = lc.loan_id
        LEFT JOIN borrowers b ON lc.borrower_id = b.id
        WHERE t.tenant_id = $1 AND t.assigned_to = $2 AND t.status = $3
        ORDER BY t.priority DESC, t.created_at DESC
        LIMIT $4 OFFSET $5
      `, [tenantId, userId, status, parseInt(limit), offset]);
            res.json(result.rows);
        }
        catch (error) {
            logger_1.logger.error('Get user tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch user tasks' });
        }
    }
}
exports.CaseController = CaseController;
//# sourceMappingURL=caseController.js.map
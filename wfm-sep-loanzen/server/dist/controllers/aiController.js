"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const aiService_1 = require("../services/aiService");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class AIController {
    static async scoreCredit(req, res) {
        try {
            const tenantId = req.tenant.id;
            const { loanId, features } = req.body;
            if (!loanId) {
                res.status(400).json({ error: 'Loan ID is required' });
                return;
            }
            // Verify loan exists and belongs to tenant
            const loanResult = await connection_1.pool.query('SELECT * FROM loan_cases WHERE loan_id = $1 AND tenant_id = $2', [loanId, tenantId]);
            if (loanResult.rows.length === 0) {
                res.status(404).json({ error: 'Loan case not found' });
                return;
            }
            const result = await aiService_1.AIService.scoreCredit(tenantId, loanId, features || {});
            res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Credit scoring error:', error);
            res.status(500).json({ error: 'Failed to generate credit score' });
        }
    }
    static async parseDocument(req, res) {
        try {
            const tenantId = req.tenant.id;
            const { documentId, extractFields } = req.body;
            if (!documentId) {
                res.status(400).json({ error: 'Document ID is required' });
                return;
            }
            // Verify document exists and belongs to tenant
            const documentResult = await connection_1.pool.query('SELECT * FROM documents WHERE id = $1 AND tenant_id = $2', [documentId, tenantId]);
            if (documentResult.rows.length === 0) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            const result = await aiService_1.AIService.parseDocument(tenantId, documentId, extractFields || []);
            res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Document parsing error:', error);
            res.status(500).json({ error: 'Failed to parse document' });
        }
    }
    static async getModelRuns(req, res) {
        try {
            const tenantId = req.tenant.id;
            const { modelId, status, page = '1', limit = '50' } = req.query;
            let query = `
        SELECT * FROM model_runs 
        WHERE tenant_id = $1
      `;
            const params = [tenantId];
            let paramIndex = 2;
            if (modelId) {
                query += ` AND model_id = $${paramIndex}`;
                params.push(modelId);
                paramIndex++;
            }
            if (status) {
                query += ` AND status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }
            query += ' ORDER BY timestamp DESC';
            // Add pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit), offset);
            const result = await connection_1.pool.query(query, params);
            res.json(result.rows);
        }
        catch (error) {
            logger_1.logger.error('Get model runs error:', error);
            res.status(500).json({ error: 'Failed to fetch model runs' });
        }
    }
    static async getDashboardMetrics(req, res) {
        try {
            const tenantId = req.tenant.id;
            const { timeRange = '7d' } = req.query;
            // Calculate time filter
            const timeFilter = this.getTimeFilter(timeRange);
            // Get model performance metrics
            const modelMetricsResult = await connection_1.pool.query(`
        SELECT 
          model_id,
          COUNT(*) as total_runs,
          AVG(execution_time) as avg_execution_time,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_runs
        FROM model_runs 
        WHERE tenant_id = $1 AND timestamp >= $2
        GROUP BY model_id
        ORDER BY total_runs DESC
      `, [tenantId, timeFilter]);
            // Get scoring distribution
            const scoringDistributionResult = await connection_1.pool.query(`
        SELECT 
          CASE 
            WHEN pd_score <= 0.1 THEN 'Low Risk'
            WHEN pd_score <= 0.3 THEN 'Medium Risk'
            ELSE 'High Risk'
          END as risk_category,
          COUNT(*) as count
        FROM loan_cases 
        WHERE tenant_id = $1 AND pd_score IS NOT NULL AND created_at >= $2
        GROUP BY risk_category
      `, [tenantId, timeFilter]);
            // Get automation metrics
            const automationMetricsResult = await connection_1.pool.query(`
        SELECT 
          action_type,
          COUNT(*) as count,
          AVG(confidence_score) as avg_confidence
        FROM autonomy_actions 
        WHERE tenant_id = $1 AND executed_at >= $2
        GROUP BY action_type
      `, [tenantId, timeFilter]);
            res.json({
                modelMetrics: modelMetricsResult.rows,
                scoringDistribution: scoringDistributionResult.rows,
                automationMetrics: automationMetricsResult.rows,
                timeRange,
                generatedAt: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Get dashboard metrics error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
        }
    }
    static getTimeFilter(timeRange) {
        const now = new Date();
        const timeMap = {
            '1d': 1,
            '7d': 7,
            '30d': 30,
            '90d': 90
        };
        const days = timeMap[timeRange] || 7;
        return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }
}
exports.AIController = AIController;
//# sourceMappingURL=aiController.js.map
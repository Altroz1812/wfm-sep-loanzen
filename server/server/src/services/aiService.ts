import { pool } from '../database/connection';
import { config } from '../config';
import { ModelRun } from '../types';
import { logger } from '../utils/logger';

export class AIService {
  static async scoreCredit(
    tenantId: string,
    loanId: string,
    features: Record<string, any>
  ): Promise<{ pdScore: number; explainability: Record<string, any>; modelId: string }> {
    const startTime = Date.now();
    
    try {
      // Mock AI scoring logic (replace with actual AI service call)
      const mockScore = this.generateMockCreditScore(features);
      
      const modelRun: Omit<ModelRun, 'id'> = {
        tenantId,
        modelId: 'credit_risk_v1',
        modelVersion: '1.2.0',
        inputData: { loanId, ...features },
        outputData: mockScore,
        explainability: mockScore.explainability,
        executionTime: Date.now() - startTime,
        status: 'success',
        timestamp: new Date()
      };

      // Log model run
      await this.logModelRun(modelRun);

      // Update loan case with PD score
      await pool.query(
        'UPDATE loan_cases SET pd_score = $1 WHERE loan_id = $2 AND tenant_id = $3',
        [mockScore.pdScore, loanId, tenantId]
      );

      return {
        pdScore: mockScore.pdScore,
        explainability: mockScore.explainability,
        modelId: modelRun.modelId
      };
    } catch (error) {
      logger.error('Credit scoring failed:', error);
      
      // Log failed model run
      await this.logModelRun({
        tenantId,
        modelId: 'credit_risk_v1',
        modelVersion: '1.2.0',
        inputData: { loanId, ...features },
        outputData: {},
        executionTime: Date.now() - startTime,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      throw error;
    }
  }

  static async parseDocument(
    tenantId: string,
    documentId: string,
    extractFields: string[]
  ): Promise<Record<string, any>> {
    const startTime = Date.now();
    
    try {
      // Mock document parsing logic (replace with actual AI service call)
      const extractedData = this.generateMockDocumentExtraction(extractFields);
      
      // Update document with extracted data
      await pool.query(
        'UPDATE documents SET extracted_data = $1 WHERE id = $2 AND tenant_id = $3',
        [JSON.stringify(extractedData), documentId, tenantId]
      );

      // Log model run
      await this.logModelRun({
        tenantId,
        modelId: 'document_parser_v1',
        modelVersion: '1.0.0',
        inputData: { documentId, extractFields },
        outputData: extractedData,
        executionTime: Date.now() - startTime,
        status: 'success',
        timestamp: new Date()
      });

      return extractedData;
    } catch (error) {
      logger.error('Document parsing failed:', error);
      throw error;
    }
  }

  static async callAIService(
    tenantId: string,
    caseId: string,
    endpoint: string,
    params: Record<string, any>
  ): Promise<any> {
    if (endpoint === 'ai/score') {
      const features = await this.extractFeaturesForCase(tenantId, caseId);
      return this.scoreCredit(tenantId, caseId, { ...features, ...params });
    }
    
    if (endpoint === 'ai/parse') {
      // Get documents for case
      const documents = await pool.query(
        'SELECT id FROM documents WHERE case_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 1',
        [caseId, tenantId]
      );
      
      if (documents.rows.length > 0) {
        return this.parseDocument(tenantId, documents.rows[0].id, params.extractFields || []);
      }
    }

    throw new Error(`Unknown AI service endpoint: ${endpoint}`);
  }

  private static async extractFeaturesForCase(
    tenantId: string,
    caseId: string
  ): Promise<Record<string, any>> {
    // Get loan case details
    const loanResult = await pool.query(`
      SELECT 
        lc.*,
        b.name as borrower_name,
        b.pan,
        b.kyc_status
      FROM loan_cases lc
      JOIN borrowers b ON lc.borrower_id = b.id
      WHERE lc.loan_id = $1 AND lc.tenant_id = $2
    `, [caseId, tenantId]);

    if (loanResult.rows.length === 0) {
      throw new Error('Loan case not found');
    }

    const loan = loanResult.rows[0];
    
    return {
      requestedAmount: loan.requested_amount,
      tenor: loan.tenor,
      productId: loan.product_id,
      kycStatus: loan.kyc_status,
      borrowerPan: loan.pan,
      // Add more features as needed
    };
  }

  private static generateMockCreditScore(features: Record<string, any>): any {
    // Mock credit scoring logic
    const baseScore = 0.1;
    let score = baseScore;

    // Adjust score based on features
    if (features.requestedAmount > 100000) score += 0.05;
    if (features.tenor > 24) score += 0.03;
    if (features.kycStatus !== 'verified') score += 0.08;

    // Add some randomness
    score += (Math.random() - 0.5) * 0.1;
    score = Math.max(0, Math.min(1, score)); // Clamp between 0 and 1

    return {
      pdScore: Math.round(score * 10000) / 10000, // Round to 4 decimal places
      explainability: {
        factors: {
          loan_amount: {
            value: features.requestedAmount,
            weight: 0.3,
            impact: features.requestedAmount > 100000 ? 'negative' : 'positive'
          },
          tenor: {
            value: features.tenor,
            weight: 0.2,
            impact: features.tenor > 24 ? 'negative' : 'positive'
          },
          kyc_status: {
            value: features.kycStatus,
            weight: 0.4,
            impact: features.kycStatus === 'verified' ? 'positive' : 'negative'
          }
        },
        confidence: 0.85
      }
    };
  }

  private static generateMockDocumentExtraction(extractFields: string[]): Record<string, any> {
    const mockData: Record<string, any> = {};
    
    extractFields.forEach(field => {
      switch (field) {
        case 'name':
          mockData[field] = 'John Doe';
          break;
        case 'pan':
          mockData[field] = 'ABCDE1234F';
          break;
        case 'income':
          mockData[field] = 50000;
          break;
        case 'address':
          mockData[field] = '123 Main Street, City, State';
          break;
        default:
          mockData[field] = `extracted_${field}`;
      }
    });

    return {
      extractedFields: mockData,
      confidence: 0.92,
      processingTime: 1250
    };
  }

  private static async logModelRun(modelRun: Omit<ModelRun, 'id'>): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO model_runs (tenant_id, model_id, model_version, input_data, output_data, explainability, execution_time, status, error_message, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        modelRun.tenantId,
        modelRun.modelId,
        modelRun.modelVersion,
        JSON.stringify(modelRun.inputData),
        JSON.stringify(modelRun.outputData),
        modelRun.explainability ? JSON.stringify(modelRun.explainability) : null,
        modelRun.executionTime,
        modelRun.status,
        modelRun.errorMessage || null,
        modelRun.timestamp
      ]);
    } catch (error) {
      logger.error('Failed to log model run:', error);
    }
  }
}
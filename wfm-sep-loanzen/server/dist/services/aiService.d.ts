export declare class AIService {
    static scoreCredit(tenantId: string, loanId: string, features: Record<string, any>): Promise<{
        pdScore: number;
        explainability: Record<string, any>;
        modelId: string;
    }>;
    static parseDocument(tenantId: string, documentId: string, extractFields: string[]): Promise<Record<string, any>>;
    static callAIService(tenantId: string, caseId: string, endpoint: string, params: Record<string, any>): Promise<any>;
    private static extractFeaturesForCase;
    private static generateMockCreditScore;
    private static generateMockDocumentExtraction;
    private static logModelRun;
}
//# sourceMappingURL=aiService.d.ts.map
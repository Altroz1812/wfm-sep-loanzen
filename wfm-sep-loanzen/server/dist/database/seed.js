"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = void 0;
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const types_1 = require("../types");
const seedData = async () => {
    try {
        if (!connection_1.supabase) {
            throw new Error('Supabase client not initialized. Please check your environment variables.');
        }
        // Create demo tenant
        const { data: tenantData, error: tenantError } = await connection_1.supabase
            .from('tenants')
            .upsert({
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Demo Bank',
            domain: 'demo.lendingbank.com',
            settings: { features: ['ai_scoring', 'document_processing'] },
            is_active: true
        }, { onConflict: 'domain' })
            .select()
            .single();
        if (tenantError) {
            logger_1.logger.error('Failed to create tenant:', tenantError);
            throw tenantError;
        }
        logger_1.logger.info('Demo tenant created successfully');
        const tenantId = '550e8400-e29b-41d4-a716-446655440000';
        // Create demo users with different roles
        const passwordHash = await bcryptjs_1.default.hash('password123', 10);
        const users = [
            { email: 'admin@demo.com', name: 'System Admin', role: types_1.UserRole.ADMIN },
            { email: 'maker@demo.com', name: 'Loan Maker', role: types_1.UserRole.MAKER },
            { email: 'checker@demo.com', name: 'Loan Checker', role: types_1.UserRole.CHECKER },
            { email: 'underwriter@demo.com', name: 'Senior Underwriter', role: types_1.UserRole.UNDERWRITER },
            { email: 'disbursement@demo.com', name: 'Disbursement Officer', role: types_1.UserRole.DISBURSEMENT_OFFICER },
            { email: 'auditor@demo.com', name: 'Risk Auditor', role: types_1.UserRole.AUDITOR }
        ];
        logger_1.logger.info('Creating demo users...');
        for (const user of users) {
            const { error: userError } = await connection_1.supabase
                .from('users')
                .upsert({
                tenant_id: tenantId,
                email: user.email,
                password_hash: passwordHash,
                name: user.name,
                role: user.role,
                is_active: true
            }, { onConflict: 'tenant_id,email' });
            if (userError) {
                logger_1.logger.error(`Failed to create user ${user.email}:`, userError);
            }
            else {
                logger_1.logger.info(`Created user: ${user.email}`);
            }
        }
        // Create sample workflow definition for micro loans
        const workflowDefinition = {
            workflowId: 'micro_loan_process',
            version: 1,
            tenantId,
            name: 'Micro Loan Processing Workflow',
            description: 'Automated workflow for processing micro loans with AI integration',
            stages: [
                { id: 'draft', label: 'Draft Application', slaHours: 48, assignedRoles: [types_1.UserRole.MAKER] },
                { id: 'document_verification', label: 'Document Verification', slaHours: 24, assignedRoles: [types_1.UserRole.CHECKER] },
                { id: 'credit_assessment', label: 'Credit Assessment', slaHours: 72, assignedRoles: [types_1.UserRole.UNDERWRITER] },
                { id: 'approval', label: 'Final Approval', slaHours: 24, assignedRoles: [types_1.UserRole.UNDERWRITER] },
                { id: 'disbursement', label: 'Disbursement', slaHours: 48, assignedRoles: [types_1.UserRole.DISBURSEMENT_OFFICER] },
                { id: 'completed', label: 'Completed', slaHours: null }
            ],
            transitions: [
                {
                    id: 'submit_application',
                    from: 'draft',
                    to: 'document_verification',
                    condition: 'true',
                    roles: [types_1.UserRole.MAKER],
                    actions: ['submit']
                },
                {
                    id: 'verify_documents',
                    from: 'document_verification',
                    to: 'credit_assessment',
                    condition: 'documents_verified',
                    roles: [types_1.UserRole.CHECKER],
                    actions: ['verify']
                },
                {
                    id: 'reject_documents',
                    from: 'document_verification',
                    to: 'draft',
                    condition: 'documents_incomplete',
                    roles: [types_1.UserRole.CHECKER],
                    actions: ['reject']
                },
                {
                    id: 'approve_loan',
                    from: 'credit_assessment',
                    to: 'approval',
                    condition: 'pd_score <= 0.15',
                    roles: [types_1.UserRole.UNDERWRITER],
                    actions: ['approve']
                },
                {
                    id: 'reject_loan',
                    from: 'credit_assessment',
                    to: 'completed',
                    condition: 'pd_score > 0.30',
                    roles: [types_1.UserRole.UNDERWRITER],
                    actions: ['reject']
                },
                {
                    id: 'final_approval',
                    from: 'approval',
                    to: 'disbursement',
                    condition: 'approved',
                    roles: [types_1.UserRole.UNDERWRITER],
                    actions: ['final_approve']
                },
                {
                    id: 'disburse_loan',
                    from: 'disbursement',
                    to: 'completed',
                    condition: 'disbursed',
                    roles: [types_1.UserRole.DISBURSEMENT_OFFICER],
                    actions: ['disburse']
                }
            ],
            autoRules: [
                {
                    id: 'auto_score_credit',
                    stage: 'credit_assessment',
                    trigger: 'onEnter',
                    action: 'call:ai/score',
                    params: { model: 'credit_risk_v1' }
                },
                {
                    id: 'auto_extract_documents',
                    stage: 'document_verification',
                    trigger: 'onEnter',
                    action: 'call:ai/parse',
                    params: { extractFields: ['name', 'pan', 'income'] }
                }
            ]
        };
        logger_1.logger.info('Creating workflow configuration...');
        const { error: workflowError } = await connection_1.supabase
            .from('workflow_configs')
            .upsert({
            workflow_id: workflowDefinition.workflowId,
            tenant_id: workflowDefinition.tenantId,
            version: workflowDefinition.version,
            name: workflowDefinition.name,
            description: workflowDefinition.description,
            config: workflowDefinition,
            is_active: true
        }, { onConflict: 'workflow_id' });
        if (workflowError) {
            logger_1.logger.error('Failed to create workflow:', workflowError);
            throw workflowError;
        }
        logger_1.logger.info('Workflow configuration created successfully');
        // Create sample borrowers
        const borrowers = [
            { name: 'Rajesh Kumar', pan: 'ABCDE1234F', kyc_status: 'completed', email: 'rajesh@example.com', phone: '+91-9876543210' },
            { name: 'Priya Sharma', pan: 'FGHIJ5678K', kyc_status: 'pending', email: 'priya@example.com', phone: '+91-9876543211' },
            { name: 'Amit Patel', pan: 'LMNOP9012Q', kyc_status: 'completed', email: 'amit@example.com', phone: '+91-9876543212' }
        ];
        const borrowerIds = [];
        logger_1.logger.info('Creating sample borrowers...');
        for (const borrower of borrowers) {
            const { data: borrowerData, error: borrowerError } = await connection_1.supabase
                .from('borrowers')
                .insert({
                tenant_id: tenantId,
                name: borrower.name,
                pan: borrower.pan,
                kyc_status: borrower.kyc_status,
                email: borrower.email,
                phone: borrower.phone
            })
                .select('*')
                .single();
            if (borrowerError) {
                logger_1.logger.error(`Failed to create borrower ${borrower.name}:`, borrowerError);
            }
            else {
                logger_1.logger.info(`Created borrower: ${borrower.name}`);
                borrowerIds.push(borrowerData.id);
            }
        }
        // Create sample loan cases
        if (borrowerIds.length > 0) {
            logger_1.logger.info('Creating sample loan cases...');
            const { data: makerUser } = await connection_1.supabase
                .from('users')
                .select('id')
                .eq('role', types_1.UserRole.MAKER)
                .eq('tenant_id', tenantId)
                .single();
            if (makerUser) {
                const makerId = makerUser.id;
                for (let i = 0; i < borrowerIds.length; i++) {
                    // Create case
                    const { data: caseData, error: caseError } = await connection_1.supabase
                        .from('cases')
                        .insert({
                        tenant_id: tenantId,
                        workflow_id: 'micro_loan_process',
                        current_stage: 'draft',
                        assigned_to: makerId,
                        created_by: makerId,
                        status: 'draft',
                        priority: 'medium',
                        data: { loanType: 'micro', purpose: 'business' }
                    })
                        .select('*')
                        .single();
                    if (caseError) {
                        logger_1.logger.error(`Failed to create case:`, caseError);
                        continue;
                    }
                    const caseId = caseData.id;
                    logger_1.logger.info(`Created case: ${caseId}`);
                    // Create loan case
                    const { error: loanCaseError } = await connection_1.supabase
                        .from('loan_cases')
                        .insert({
                        loan_id: caseId,
                        tenant_id: tenantId,
                        borrower_id: borrowerIds[i],
                        product_id: 'micro_loan',
                        requested_amount: 50000 + (i * 25000),
                        tenor: 12
                    });
                    if (loanCaseError) {
                        logger_1.logger.error(`Failed to create loan case:`, loanCaseError);
                    }
                    else {
                        logger_1.logger.info(`Created loan case for borrower: ${borrowerIds[i]}`);
                    }
                }
            }
        }
        logger_1.logger.info('Sample data seeded successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to seed data:', error);
        throw error;
    }
};
exports.seedData = seedData;
// Run seed if this file is executed directly
if (require.main === module) {
    seedData()
        .then(() => {
        logger_1.logger.info('Seeding completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map
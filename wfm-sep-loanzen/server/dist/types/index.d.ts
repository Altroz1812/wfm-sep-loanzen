export interface User {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    ADMIN = "Admin",
    MAKER = "Maker",
    CHECKER = "Checker",
    UNDERWRITER = "Underwriter",
    DISBURSEMENT_OFFICER = "DisbursementOfficer",
    AUDITOR = "Auditor"
}
export interface Tenant {
    id: string;
    name: string;
    domain: string;
    isActive: boolean;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowDefinition {
    workflowId: string;
    version: number;
    tenantId: string;
    name: string;
    description?: string;
    isActive: boolean;
    stages: WorkflowStage[];
    transitions: WorkflowTransition[];
    autoRules: AutoRule[];
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStage {
    id: string;
    label: string;
    description?: string;
    slaHours?: number;
    assignedRoles?: UserRole[];
    requiredFields?: string[];
    validations?: Record<string, any>;
}
export interface WorkflowTransition {
    id: string;
    from: string;
    to: string;
    condition: string;
    roles: UserRole[];
    actions: string[];
    requiresApproval?: boolean;
    approvalRoles?: UserRole[];
}
export interface AutoRule {
    id: string;
    stage: string;
    trigger: 'onEnter' | 'onExit' | 'scheduled';
    action: string;
    params: Record<string, any>;
    condition?: string;
}
export interface Case {
    id: string;
    tenantId: string;
    type: 'loan' | 'generic';
    workflowId: string;
    currentStage: string;
    status: CaseStatus;
    priority: CasePriority;
    assignedTo?: string;
    createdBy: string;
    data: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface LoanCase extends Case {
    loanId: string;
    borrowerId: string;
    productId: string;
    requestedAmount: number;
    tenor: number;
    decision?: LoanDecision;
    pdScore?: number;
}
export declare enum CaseStatus {
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    ON_HOLD = "on_hold"
}
export declare enum CasePriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum LoanDecision {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    NEEDS_REVIEW = "needs_review"
}
export interface Borrower {
    id: string;
    tenantId: string;
    name: string;
    pan: string;
    kycStatus: string;
    email?: string;
    phone?: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Task {
    id: string;
    tenantId: string;
    caseId: string;
    assignedTo: string;
    title: string;
    description?: string;
    type: TaskType;
    status: TaskStatus;
    priority: CasePriority;
    dueDate?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum TaskType {
    REVIEW = "review",
    APPROVAL = "approval",
    VERIFICATION = "verification",
    DOCUMENTATION = "documentation",
    DISBURSEMENT = "disbursement"
}
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface Document {
    id: string;
    tenantId: string;
    caseId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedBy: string;
    extractedData?: Record<string, any>;
    createdAt: Date;
}
export interface AuditLog {
    id: string;
    tenantId: string;
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface ModelRun {
    id: string;
    tenantId: string;
    modelId: string;
    modelVersion: string;
    inputData: Record<string, any>;
    outputData: Record<string, any>;
    explainability?: Record<string, any>;
    executionTime: number;
    status: 'success' | 'error';
    errorMessage?: string;
    timestamp: Date;
}
export interface AuthRequest extends Request {
    user?: User;
    tenant?: Tenant;
}
//# sourceMappingURL=index.d.ts.map
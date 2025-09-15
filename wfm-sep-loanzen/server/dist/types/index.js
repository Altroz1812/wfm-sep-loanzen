"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.TaskType = exports.LoanDecision = exports.CasePriority = exports.CaseStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "Admin";
    UserRole["MAKER"] = "Maker";
    UserRole["CHECKER"] = "Checker";
    UserRole["UNDERWRITER"] = "Underwriter";
    UserRole["DISBURSEMENT_OFFICER"] = "DisbursementOfficer";
    UserRole["AUDITOR"] = "Auditor";
})(UserRole || (exports.UserRole = UserRole = {}));
var CaseStatus;
(function (CaseStatus) {
    CaseStatus["ACTIVE"] = "active";
    CaseStatus["COMPLETED"] = "completed";
    CaseStatus["CANCELLED"] = "cancelled";
    CaseStatus["ON_HOLD"] = "on_hold";
})(CaseStatus || (exports.CaseStatus = CaseStatus = {}));
var CasePriority;
(function (CasePriority) {
    CasePriority["LOW"] = "low";
    CasePriority["MEDIUM"] = "medium";
    CasePriority["HIGH"] = "high";
    CasePriority["URGENT"] = "urgent";
})(CasePriority || (exports.CasePriority = CasePriority = {}));
var LoanDecision;
(function (LoanDecision) {
    LoanDecision["PENDING"] = "pending";
    LoanDecision["APPROVED"] = "approved";
    LoanDecision["REJECTED"] = "rejected";
    LoanDecision["NEEDS_REVIEW"] = "needs_review";
})(LoanDecision || (exports.LoanDecision = LoanDecision = {}));
var TaskType;
(function (TaskType) {
    TaskType["REVIEW"] = "review";
    TaskType["APPROVAL"] = "approval";
    TaskType["VERIFICATION"] = "verification";
    TaskType["DOCUMENTATION"] = "documentation";
    TaskType["DISBURSEMENT"] = "disbursement";
})(TaskType || (exports.TaskType = TaskType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
//# sourceMappingURL=index.js.map
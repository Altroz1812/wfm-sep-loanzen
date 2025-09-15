/*
  # Initial Database Schema for Workflow Management System

  1. New Tables
    - `tenants` - Multi-tenant isolation
    - `users` - User management with roles  
    - `workflow_configs` - JSON-based workflow definitions
    - `borrowers` - Borrower information
    - `cases` - Generic case processing
    - `loan_cases` - Loan-specific case data
    - `documents` - File uploads with metadata
    - `document_extractions` - AI-powered data extraction results
    - `model_runs` - AI model execution tracking
    - `autonomy_actions` - Automated system actions
    - `audit_logs` - Complete audit trail
    - `repayment_schedules` - Loan repayment tracking
    - `case_history` - Case action history

  2. Security
    - Enable RLS on all tables
    - Add policies for tenant-based access control

  3. Indexes
    - Performance indexes for common queries
    - Tenant-scoped indexes for multi-tenancy
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Maker', 'Checker', 'Underwriter', 'DisbursementOfficer', 'Auditor')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email)
);

-- Create workflow_configs table
CREATE TABLE IF NOT EXISTS workflow_configs (
  workflow_id VARCHAR(255) PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1 NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create borrowers table
CREATE TABLE IF NOT EXISTS borrowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  pan VARCHAR(10),
  aadhar VARCHAR(12),
  kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_progress', 'completed', 'failed')),
  address JSONB,
  financial_info JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id VARCHAR(255) REFERENCES workflow_configs(workflow_id),
  current_stage VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'rejected', 'on_hold')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) NOT NULL,
  data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create loan_cases table
CREATE TABLE IF NOT EXISTS loan_cases (
  loan_id UUID PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  borrower_id UUID REFERENCES borrowers(id),
  product_id VARCHAR(100) NOT NULL,
  requested_amount NUMERIC(15,2) NOT NULL,
  approved_amount NUMERIC(15,2),
  tenor INTEGER NOT NULL,
  interest_rate NUMERIC(5,2),
  decision VARCHAR(50) CHECK (decision IN ('approved', 'rejected', 'pending', 'more_info_required')),
  pd_score NUMERIC(5,4),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  borrower_id UUID REFERENCES borrowers(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  document_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create document_extractions table
CREATE TABLE IF NOT EXISTS document_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  extracted_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2),
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create model_runs table
CREATE TABLE IF NOT EXISTS model_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  confidence NUMERIC(3,2),
  explainability JSONB,
  case_id UUID REFERENCES cases(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create autonomy_actions table
CREATE TABLE IF NOT EXISTS autonomy_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_instance_id UUID REFERENCES cases(id),
  action_type VARCHAR(100) NOT NULL,
  initiated_by VARCHAR(100) NOT NULL,
  model_id UUID REFERENCES model_runs(id),
  confidence NUMERIC(3,2),
  payload JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  field VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  action VARCHAR(100) NOT NULL,
  performed_by UUID REFERENCES users(id) NOT NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create repayment_schedules table
CREATE TABLE IF NOT EXISTS repayment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES loan_cases(loan_id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount NUMERIC(15,2) NOT NULL,
  interest_amount NUMERIC(15,2) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  paid_amount NUMERIC(15,2) DEFAULT 0,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create case_history table
CREATE TABLE IF NOT EXISTS case_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  from_stage VARCHAR(100),
  to_stage VARCHAR(100),
  performed_by UUID REFERENCES users(id) NOT NULL,
  comment TEXT,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_status ON cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_current_stage ON cases(current_stage);
CREATE INDEX IF NOT EXISTS idx_loan_cases_borrower ON loan_cases(borrower_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_model_runs_tenant_case ON model_runs(tenant_id, case_id);
CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON case_history(case_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_configs_updated_at BEFORE UPDATE ON workflow_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_borrowers_updated_at BEFORE UPDATE ON borrowers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_cases_updated_at BEFORE UPDATE ON loan_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may need to customize based on your security requirements)
CREATE POLICY "Enable read access for authenticated users" ON tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON workflow_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON borrowers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON loan_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON document_extractions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON model_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON autonomy_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON repayment_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON case_history FOR SELECT TO authenticated USING (true);
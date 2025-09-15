# AI-Powered Multi-Tenant Workflow Management System

A comprehensive workflow management system specifically designed for Loan Origination Systems (LOS) and Loan Management Systems (LMS) with integrated AI capabilities.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Complete tenant isolation and data security
- **Workflow Engine**: JSON-based workflow configuration with runtime execution
- **Role-based Access Control**: Admin, Maker, Checker, Underwriter, DisbursementOfficer, Auditor
- **Case Management**: Generic and loan-specific case processing
- **Task Management**: Automated task assignment and tracking
- **Document Management**: File upload with AI-powered extraction
- **Complete Audit Trail**: Full tracking of all user actions and system changes

### AI Integration
- **Credit Scoring**: Automated PD (Probability of Default) calculation
- **Document Processing**: AI-powered data extraction from uploaded documents
- **Model Logging**: Complete tracking of AI model runs for training and analysis
- **Explainability**: AI decision transparency for regulatory compliance
- **Performance Monitoring**: Real-time AI model health and performance metrics

### Technical Stack
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Next.js + Tailwind CSS
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: JWT-based with tenant-scoped tokens
- **API Documentation**: OpenAPI 3.0 specification
- **Development**: Docker containers for local setup

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Git

## 🛠️ Quick Setup

### 0. Supabase Setup (Required)

⚠️ **CRITICAL**: Before running the application locally, you MUST set up a Supabase project and update the environment variables:

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be fully initialized

2. **Run Database Migration**:
   - In your Supabase dashboard, go to the SQL Editor
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute the SQL to create all tables and setup RLS

3. **Get Your Credentials**:
   - Go to Project Settings > API
   - Copy your Project URL and `anon` public key
   - Copy your `service_role` secret key (for server-side operations)

4. **Configure Environment Variables**:
   ```bash
   # Copy and update server environment
   # Edit server/.env with your ACTUAL Supabase credentials
   # Replace the placeholder values with your real project URL and keys
   
   # Copy and update client environment  
   cp client/.env.local.example client/.env.local
   # Edit client/.env.local with your ACTUAL Supabase credentials
   ```

   **⚠️ IMPORTANT**: The server will NOT start with placeholder values. You must replace:
   - `SUPABASE_URL` with your actual project URL (e.g., `https://abcdefghijk.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` with your actual service role key
   - `SUPABASE_ANON_KEY` with your actual anon key

### 1. Clone and Install Dependencies
```bash
npm run setup
```

### 2. Seed Sample Data
```bash
# Seed your Supabase database with sample data
npm run db:seed
```

### 3. Start Development Servers
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend application on http://localhost:3001 (with real-time features enabled)

## 🔐 Demo Credentials

The system comes with pre-seeded demo users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Maker | maker@demo.com | password123 |
| Checker | checker@demo.com | password123 |
| Underwriter | underwriter@demo.com | password123 |
| Disbursement Officer | disbursement@demo.com | password123 |
| Auditor | auditor@demo.com | password123 |

## 📖 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 🏗️ Architecture Overview

### Database Schema
```sql
-- Core Tables
tenants              # Multi-tenant isolation
users                # User management with roles
workflow_definitions # JSON-based workflow configurations
cases                # Generic case processing
loan_cases          # Loan-specific case data
borrowers           # Borrower information
tasks               # Task assignment and tracking
documents           # File uploads with metadata

-- Audit & AI Tables
audit_logs          # Complete audit trail
model_runs          # AI model execution tracking
autonomy_actions    # Automated system actions
```

### Workflow Configuration
```json
{
  "workflowId": "micro_loan_process",
  "version": 1,
  "name": "Micro Loan Processing",
  "stages": [
    {"id": "draft", "label": "Draft Application", "slaHours": 48},
    {"id": "document_verification", "label": "Document Verification", "slaHours": 24},
    {"id": "credit_assessment", "label": "Credit Assessment", "slaHours": 72}
  ],
  "transitions": [
    {
      "from": "draft",
      "to": "document_verification",
      "condition": "true",
      "roles": ["Maker"],
      "actions": ["submit"]
    }
  ],
  "autoRules": [
    {
      "stage": "credit_assessment",
      "trigger": "onEnter",
      "action": "call:ai/score",
      "params": {"model": "credit_risk_v1"}
    }
  ]
}
```

## 🔧 Key API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

### Workflow Management
- `GET /api/{tenant}/workflows` - List all workflows
- `POST /api/{tenant}/workflows` - Create workflow
- `GET /api/{tenant}/workflows/{id}` - Get workflow details

### Case Management
- `GET /api/{tenant}/cases` - List cases with filtering
- `POST /api/{tenant}/cases` - Create new case
- `GET /api/{tenant}/cases/{id}` - Get case details
- `POST /api/{tenant}/cases/{id}/action` - Execute workflow action

### AI Services
- `POST /api/{tenant}/ai/score` - Credit scoring
- `POST /api/{tenant}/ai/parse` - Document parsing
- `GET /api/{tenant}/dashboard/ai` - AI performance metrics

## 🎯 Sample Workflow: Loan Origination

The system includes a complete loan origination workflow:

1. **Draft** - Maker creates loan application
2. **Document Verification** - Checker validates documents
3. **Credit Assessment** - AI scoring + Underwriter review
4. **Approval** - Final underwriter approval
5. **Disbursement** - Disbursement officer processes payout
6. **Completed** - Case closed

### AI Integration Points
- **Document Upload**: Automatic data extraction (name, PAN, income)
- **Credit Assessment**: PD score calculation with explainability
- **Decision Support**: Risk-based routing and recommendations

## 📊 Monitoring & Analytics

### AI Performance Dashboard
- Model execution metrics
- Success rates and response times
- Credit risk distribution
- Automation effectiveness

### Audit Capabilities
- Complete action history
- User activity tracking
- Data change logs
- Compliance reporting

## 🔒 Security & Compliance

### Data Protection
- Tenant-level data isolation
- PII redaction in logs
- Encrypted sensitive fields
- Role-based access control

### Audit Requirements
- Immutable audit trail
- Complete action logging
- Model decision tracking
- Regulatory compliance support

## 🚀 Production Deployment

### Environment Variables
```bash
NODE_ENV=production
DB_HOST=your-db-host
DB_PASSWORD=secure-password
JWT_SECRET=strong-jwt-secret
AI_SERVICE_URL=your-ai-service-url
```

### Docker Deployment
```bash
npm run build
docker-compose up -d
```

## 📚 Development

### Project Structure
```
├── server/                 # Backend application
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── database/      # DB migrations & seeds
│   │   └── types/         # TypeScript definitions
├── client/                # Frontend application
│   ├── app/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── globals.css    # Global styles
└── README.md
```

### Adding New Workflows
1. Create workflow definition JSON
2. Define stages, transitions, and auto-rules
3. Configure role permissions
4. Test workflow execution

### Extending AI Capabilities
1. Add new model endpoints
2. Update AI service integration
3. Configure model logging
4. Add performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for modern loan origination and management**
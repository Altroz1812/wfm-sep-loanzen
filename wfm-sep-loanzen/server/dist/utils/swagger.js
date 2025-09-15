"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Workflow Management System API',
        version: '1.0.0',
        description: 'AI-powered multi-tenant workflow management system for loan origination'
    },
    servers: [
        {
            url: 'http://localhost:3000/api/{tenant}',
            description: 'Development server',
            variables: {
                tenant: {
                    default: 'demo',
                    description: 'Tenant identifier'
                }
            }
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    tenantId: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    role: {
                        type: 'string',
                        enum: ['Admin', 'Maker', 'Checker', 'Underwriter', 'DisbursementOfficer', 'Auditor']
                    },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            WorkflowDefinition: {
                type: 'object',
                properties: {
                    workflowId: { type: 'string' },
                    version: { type: 'integer' },
                    tenantId: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    isActive: { type: 'boolean' },
                    stages: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                label: { type: 'string' },
                                slaHours: { type: 'integer' }
                            }
                        }
                    },
                    transitions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                from: { type: 'string' },
                                to: { type: 'string' },
                                condition: { type: 'string' },
                                roles: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            },
            Case: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    tenantId: { type: 'string', format: 'uuid' },
                    type: { type: 'string', enum: ['loan', 'generic'] },
                    workflowId: { type: 'string' },
                    currentStage: { type: 'string' },
                    status: {
                        type: 'string',
                        enum: ['active', 'completed', 'cancelled', 'on_hold']
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'urgent']
                    },
                    assignedTo: { type: 'string', format: 'uuid' },
                    createdBy: { type: 'string', format: 'uuid' },
                    data: { type: 'object' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'object' }
                }
            }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/workflows': {
            get: {
                summary: 'Get all workflow definitions',
                tags: ['Workflows'],
                responses: {
                    '200': {
                        description: 'List of workflow definitions',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/WorkflowDefinition' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Create a new workflow definition',
                tags: ['Workflows'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/WorkflowDefinition' }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Workflow created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/WorkflowDefinition' }
                            }
                        }
                    }
                }
            }
        },
        '/cases': {
            get: {
                summary: 'Get all cases',
                tags: ['Cases'],
                parameters: [
                    {
                        name: 'status',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Filter by case status'
                    },
                    {
                        name: 'assignedTo',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Filter by assigned user'
                    }
                ],
                responses: {
                    '200': {
                        description: 'List of cases',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Case' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Create a new case',
                tags: ['Cases'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Case' }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Case created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Case' }
                            }
                        }
                    }
                }
            }
        },
        '/cases/{id}': {
            get: {
                summary: 'Get case by ID',
                tags: ['Cases'],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Case details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Case' }
                            }
                        }
                    },
                    '404': {
                        description: 'Case not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/cases/{id}/action': {
            post: {
                summary: 'Execute workflow action on case',
                tags: ['Cases'],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    action: { type: 'string' },
                                    data: { type: 'object' },
                                    comment: { type: 'string' }
                                },
                                required: ['action']
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Action executed successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Case' }
                            }
                        }
                    }
                }
            }
        },
        '/ai/score': {
            post: {
                summary: 'Get AI credit score for loan application',
                tags: ['AI'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    loanId: { type: 'string', format: 'uuid' },
                                    features: { type: 'object' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'AI score generated',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        pdScore: { type: 'number' },
                                        explainability: { type: 'object' },
                                        modelId: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
const setupSwagger = (app) => {
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=swagger.js.map
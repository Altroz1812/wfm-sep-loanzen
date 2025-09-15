'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Plus, Settings, Play, Eye, Edit } from 'lucide-react';

const WorkflowDesigner: React.FC = () => {
  const { state } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  const { data: workflows, isLoading } = useQuery(
    ['workflows', state.user?.tenant.id],
    async () => {
      const response = await axios.get(`/api/${state.user?.tenant.id}/workflows`);
      return response.data;
    },
    {
      enabled: !!state.user?.tenant.id,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Workflow Designer</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows?.map((workflow: any) => (
          <div key={workflow.workflowId} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{workflow.name}</h3>
                <p className="text-gray-600 mt-1">{workflow.description || 'No description'}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-sm text-gray-500">Version {workflow.version}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    workflow.isActive ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setSelectedWorkflow(workflow)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Stages Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Stages</h4>
              <div className="flex flex-wrap gap-2">
                {workflow.stages?.slice(0, 4).map((stage: any, index: number) => (
                  <div key={stage.id} className="flex items-center">
                    <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                      {stage.label}
                    </span>
                    {index < Math.min(workflow.stages.length - 1, 3) && (
                      <span className="mx-2 text-gray-400">→</span>
                    )}
                  </div>
                ))}
                {workflow.stages?.length > 4 && (
                  <span className="text-xs text-gray-500">+{workflow.stages.length - 4} more</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Stages</p>
                <p className="text-lg font-semibold text-gray-900">
                  {workflow.stages?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Auto Rules</p>
                <p className="text-lg font-semibold text-gray-900">
                  {workflow.autoRules?.length || 0}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full btn-primary flex items-center justify-center">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sample Workflow (if no workflows exist) */}
      {workflows && workflows.length === 0 && (
        <div className="card text-center py-12">
          <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-600 mb-6">
            Create your first workflow to start managing cases and processes.
          </p>
          <button className="btn-primary">
            Create Your First Workflow
          </button>
        </div>
      )}

      {/* Workflow Details Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedWorkflow.name}
                </h2>
                <button 
                  onClick={() => setSelectedWorkflow(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Workflow Visualization */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Workflow Stages</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    {selectedWorkflow.stages?.map((stage: any, index: number) => (
                      <div key={stage.id} className="flex items-center">
                        <div className="bg-primary-100 border-2 border-primary-200 rounded-lg p-4 min-w-[140px]">
                          <h4 className="font-medium text-primary-900">{stage.label}</h4>
                          {stage.slaHours && (
                            <p className="text-xs text-primary-700 mt-1">
                              SLA: {stage.slaHours}h
                            </p>
                          )}
                          {stage.assignedRoles && (
                            <div className="mt-2">
                              {stage.assignedRoles.map((role: string) => (
                                <span key={role} className="inline-block text-xs bg-primary-200 text-primary-800 px-2 py-1 rounded-full mr-1">
                                  {role}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {index < selectedWorkflow.stages.length - 1 && (
                          <div className="mx-4 text-gray-400">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto Rules */}
                {selectedWorkflow.autoRules && selectedWorkflow.autoRules.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Automation Rules</h3>
                    <div className="space-y-3">
                      {selectedWorkflow.autoRules.map((rule: any) => (
                        <div key={rule.id} className="p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{rule.id}</h4>
                            <span className="px-2 py-1 text-xs bg-secondary-100 text-secondary-800 rounded-full">
                              {rule.trigger}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Stage:</strong> {rule.stage} | <strong>Action:</strong> {rule.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transitions */}
                {selectedWorkflow.transitions && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Transitions</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedWorkflow.transitions.map((transition: any, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{transition.from}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{transition.to}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {transition.actions.join(', ')}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {transition.roles.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDesigner;
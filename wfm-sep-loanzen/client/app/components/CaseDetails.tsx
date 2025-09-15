'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ArrowLeft, User, Calendar, DollarSign, FileText, MessageSquare, Activity, Bot } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface CaseDetailsProps {
  caseId: string;
  onBack: () => void;
}

const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId, onBack }) => {
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const [actionType, setActionType] = useState('');
  const [comment, setComment] = useState('');
  const [showActionForm, setShowActionForm] = useState(false);

  const { data: caseData, isLoading } = useQuery(
    ['case', state.user?.tenant.id, caseId],
    async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          loan_cases!inner(
            requested_amount,
            approved_amount,
            tenor,
            interest_rate,
            decision,
            pd_score,
            borrower_id,
            borrowers!inner(
              id,
              name,
              pan,
              email,
              phone
            )
          ),
          documents(
            id,
            file_name,
            file_type,
            file_size,
            document_type,
            created_at,
            document_extractions(
              extracted_data,
              confidence_score
            )
          ),
          case_history(
            id,
            action,
            from_stage,
            to_stage,
            comment,
            timestamp,
            users!inner(
              name,
              email
            )
          ),
          assigned_user:users!cases_assigned_to_fkey(
            name
          ),
          creator:users!cases_created_by_fkey(
            name
          )
        `)
        .eq('id', caseId)
        .eq('tenant_id', state.user?.tenant.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tenantId: data.tenant_id,
        type: 'loan',
        workflowId: data.workflow_id,
        currentStage: data.current_stage,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assigned_to,
        assignedUserName: data.assigned_user?.name,
        createdBy: data.created_by,
        createdByName: data.creator?.name,
        data: data.data,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        loanData: data.loan_cases ? {
          requestedAmount: data.loan_cases.requested_amount,
          approvedAmount: data.loan_cases.approved_amount,
          tenor: data.loan_cases.tenor,
          interestRate: data.loan_cases.interest_rate,
          decision: data.loan_cases.decision,
          pdScore: data.loan_cases.pd_score,
          borrower: {
            id: data.loan_cases.borrowers.id,
            name: data.loan_cases.borrowers.name,
            pan: data.loan_cases.borrowers.pan,
            email: data.loan_cases.borrowers.email,
            phone: data.loan_cases.borrowers.phone
          }
        } : null,
        documents: data.documents || [],
        auditTrail: data.case_history?.map((h: any) => ({
          id: h.id,
          action: h.action,
          fromStage: h.from_stage,
          toStage: h.to_stage,
          comment: h.comment,
          timestamp: h.timestamp,
          metadata: {
            userName: h.users.name,
            userEmail: h.users.email
          }
        })) || []
      };
    },
    {
      enabled: !!state.user?.tenant.id && !!caseId,
    }
  );

  // Set up real-time subscription for case updates
  useEffect(() => {
    if (!caseId) return;

    const channel = supabase
      .channel(`case-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cases',
          filter: `id=eq.${caseId}`
        },
        (payload) => {
          console.log('Case update received:', payload);
          queryClient.invalidateQueries(['case', state.user?.tenant.id, caseId]);
          toast.success('Case updated in real-time');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_history',
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('Case history update received:', payload);
          queryClient.invalidateQueries(['case', state.user?.tenant.id, caseId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, queryClient, state.user?.tenant.id]);

  const executeActionMutation = useMutation(
    async (actionData: { action: string; comment?: string; data?: any }) => {
      // This would typically call your backend API
      const response = await fetch(`/api/${state.user?.tenant.id}/cases/${caseId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(actionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['case', state.user?.tenant.id, caseId]);
        toast.success('Action executed successfully');
        setShowActionForm(false);
        setActionType('');
        setComment('');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Action failed');
      },
    }
  );

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionType) return;

    executeActionMutation.mutate({
      action: actionType,
      comment: comment || undefined,
    });
  };

  const getAvailableActions = () => {
    if (!caseData) return [];
    
    const currentStage = caseData.currentStage;
    const userRole = state.user?.role;

    // This would typically come from the workflow definition
    const stageActions: Record<string, string[]> = {
      'draft': ['submit'],
      'document_verification': ['verify', 'reject'],
      'credit_assessment': ['approve', 'reject'],
      'approval': ['final_approve'],
      'disbursement': ['disburse'],
    };

    return stageActions[currentStage] || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Case not found.</p>
      </div>
    );
  }

  const availableActions = getAvailableActions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Case #{caseData.id.slice(-8)}
          </h1>
          <p className="text-gray-600">
            {caseData.type} • Current Stage: {caseData.currentStage.replace('_', ' ')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Overview */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Case Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`status-${caseData.status} mt-1`}>
                  {caseData.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`priority-${caseData.priority} mt-1`}>
                  {caseData.priority}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <p className="text-sm text-gray-900 mt-1">
                  {caseData.assignedUserName || 'Unassigned'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="text-sm text-gray-900 mt-1">{caseData.createdByName}</p>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          {caseData.loanData && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Loan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Borrower</label>
                    <div className="mt-1 flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{caseData.loanData.borrower?.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PAN</label>
                    <p className="text-sm text-gray-900 mt-1">{caseData.loanData.borrower?.pan}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900 mt-1">{caseData.loanData.borrower?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested Amount</label>
                    <div className="mt-1 flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        ₹{caseData.loanData.requestedAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenor</label>
                    <p className="text-sm text-gray-900 mt-1">{caseData.loanData.tenor} months</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PD Score</label>
                    <div className="mt-1 flex items-center">
                      <Bot className="h-4 w-4 text-gray-400 mr-2" />
                      <span className={`text-sm font-medium ${
                        caseData.loanData.pdScore <= 0.15 ? 'text-success-600' :
                        caseData.loanData.pdScore <= 0.30 ? 'text-warning-600' : 'text-error-600'
                      }`}>
                        {caseData.loanData.pdScore?.toFixed(4) || 'Not scored'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {caseData.documents && caseData.documents.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              <div className="space-y-3">
                {caseData.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded {format(new Date(doc.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    {doc.document_extractions && doc.document_extractions.length > 0 && (
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                        AI Processed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          {caseData.auditTrail && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
              <div className="space-y-4">
                {caseData.auditTrail.map((entry: any) => (
                  <div key={entry.id} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{entry.metadata?.userName}</span>{' '}
                        {entry.action.toLowerCase().replace('_', ' ')}
                      </p>
                      {entry.comment && (
                        <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {availableActions.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium mb-4">Available Actions</h3>
              {!showActionForm ? (
                <div className="space-y-2">
                  {availableActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        setActionType(action);
                        setShowActionForm(true);
                      }}
                      className="w-full btn-primary"
                    >
                      {action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleExecuteAction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action: {actionType.charAt(0).toUpperCase() + actionType.slice(1).replace('_', ' ')}
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment (optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Add a comment..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={executeActionMutation.isLoading}
                      className="btn-primary flex-1"
                    >
                      {executeActionMutation.isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        'Execute'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionForm(false);
                        setActionType('');
                        setComment('');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Case Info */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4">Case Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(caseData.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(caseData.updatedAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Workflow</label>
                <p className="text-sm text-gray-900 mt-1">{caseData.workflowId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
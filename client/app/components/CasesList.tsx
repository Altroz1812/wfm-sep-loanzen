'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Search, Filter, Plus, Eye, Calendar, User, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface CasesListProps {
  onViewCase: (caseId: string) => void;
}

const CasesList: React.FC<CasesListProps> = ({ onViewCase }) => {
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: cases, isLoading, error } = useQuery(
    ['cases', state.user?.tenant.id, statusFilter, typeFilter],
    async () => {
      let query = supabase
        .from('cases')
        .select(`
          *,
          loan_cases!inner(
            requested_amount,
            tenor,
            decision,
            pd_score,
            borrower_id,
            borrowers!inner(
              name
            )
          ),
          users!cases_assigned_to_fkey(
            name
          ),
          creator:users!cases_created_by_fkey(
            name
          )
        `)
        .eq('tenant_id', state.user?.tenant.id);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map((case_: any) => ({
        id: case_.id,
        tenantId: case_.tenant_id,
        type: 'loan',
        workflowId: case_.workflow_id,
        currentStage: case_.current_stage,
        status: case_.status,
        priority: case_.priority,
        assignedTo: case_.assigned_to,
        assignedUserName: case_.users?.name,
        createdBy: case_.created_by,
        createdByName: case_.creator?.name,
        data: case_.data,
        metadata: case_.metadata,
        createdAt: case_.created_at,
        updatedAt: case_.updated_at,
        loanData: case_.loan_cases ? {
          requestedAmount: case_.loan_cases.requested_amount,
          tenor: case_.loan_cases.tenor,
          decision: case_.loan_cases.decision,
          pdScore: case_.loan_cases.pd_score,
          borrowerId: case_.loan_cases.borrower_id,
          borrowerName: case_.loan_cases.borrowers?.name
        } : null
      }));
    },
    {
      enabled: !!state.user?.tenant.id,
    }
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!state.user?.tenant.id) return;

    const channel = supabase
      .channel('cases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
          filter: `tenant_id=eq.${state.user.tenant.id}`
        },
        (payload) => {
          console.log('Cases change received:', payload);
          queryClient.invalidateQueries(['cases', state.user?.tenant.id]);
          
          if (payload.eventType === 'INSERT') {
            toast.success('New case created');
          } else if (payload.eventType === 'UPDATE') {
            toast.success('Case updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.user?.tenant.id, queryClient]);

  const filteredCases = cases?.filter((case_: any) =>
    case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.loanData?.borrowerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'rejected':
        return 'status-cancelled';
      default:
        return 'status-active';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'priority-low';
      case 'medium':
        return 'priority-medium';
      case 'high':
        return 'priority-high';
      case 'urgent':
        return 'priority-urgent';
      default:
        return 'priority-medium';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Failed to load cases. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Cases Management</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases or borrowers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-10 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field min-w-[120px]"
            >
              <option value="all">All Types</option>
              <option value="loan">Loan</option>
              <option value="generic">Generic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCases?.map((case_: any) => (
                <tr key={case_.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{case_.id.slice(-8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {case_.type}
                      </div>
                      {case_.loanData && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {case_.loanData.borrowerName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {case_.currentStage.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusStyle(case_.status)}>
                      {case_.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getPriorityStyle(case_.priority)}>
                      {case_.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {case_.assignedUserName || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(case_.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewCase(case_.id)}
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCases && filteredCases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No cases found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasesList;
'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { CheckSquare, Clock, User, Calendar, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface TasksInboxProps {
  onViewCase: (caseId: string) => void;
}

const TasksInbox: React.FC<TasksInboxProps> = ({ onViewCase }) => {
  const { state } = useAuth();
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data: tasks, isLoading } = useQuery(
    ['userTasks', state.user?.tenant.id, state.user?.id, statusFilter],
    async () => {
      const response = await axios.get(
        `/api/${state.user?.tenant.id}/tasks/my?status=${statusFilter}`
      );
      return response.data;
    },
    {
      enabled: !!state.user?.tenant.id,
    }
  );

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'approval':
        return 'bg-primary-100 text-primary-800';
      case 'review':
        return 'bg-warning-100 text-warning-800';
      case 'verification':
        return 'bg-success-100 text-success-800';
      case 'documentation':
        return 'bg-secondary-100 text-secondary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-warning-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks?.filter((t: any) => t.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-primary-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks?.filter((t: any) => t.status === 'in_progress').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-success-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-error-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task: any) => (
              <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTaskTypeColor(task.type)}`}>
                        {task.type}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {format(new Date(task.created_at), 'MMM dd, HH:mm')}
                      </div>
                      
                      {task.due_date && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Due {format(new Date(task.due_date), 'MMM dd, HH:mm')}
                        </div>
                      )}
                      
                      {task.case_type === 'loan' && task.requested_amount && (
                        <div className="flex items-center">
                          <span className="mr-1">💰</span>
                          ₹{task.requested_amount.toLocaleString()}
                        </div>
                      )}
                      
                      {task.borrower_name && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {task.borrower_name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewCase(task.case_id)}
                      className="btn-secondary flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Case
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">
                {statusFilter === 'pending' 
                  ? "You're all caught up! No pending tasks at the moment."
                  : `No ${statusFilter.replace('_', ' ')} tasks found.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksInbox;
'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  FileText, 
  Settings, 
  CheckSquare, 
  Bot,
  LogOut,
  User,
  Building2
} from 'lucide-react';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
  const { state, logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'workflows', label: 'Workflows', icon: Settings, roles: ['Admin'] },
    { id: 'ai-metrics', label: 'AI Metrics', icon: Bot, roles: ['Admin', 'Auditor'] },
  ];

  const filteredItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(state.user?.role || '')
  );

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <Building2 className="h-8 w-8 text-primary-600 mr-2" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Workflow MS</h1>
            <p className="text-xs text-gray-600">{state.user?.tenant.name}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{state.user?.name}</p>
              <p className="text-xs text-gray-600">{state.user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
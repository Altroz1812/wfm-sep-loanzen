'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';
import CasesList from './CasesList';
import WorkflowDesigner from './WorkflowDesigner';
import TasksInbox from './TasksInbox';
import AIMetrics from './AIMetrics';
import CaseDetails from './CaseDetails';

type ActiveView = 'dashboard' | 'cases' | 'workflows' | 'tasks' | 'ai-metrics' | 'case-details';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const handleViewCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveView('case-details');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'cases':
        return <CasesList onViewCase={handleViewCase} />;
      case 'workflows':
        return <WorkflowDesigner />;
      case 'tasks':
        return <TasksInbox onViewCase={handleViewCase} />;
      case 'ai-metrics':
        return <AIMetrics />;
      case 'case-details':
        return selectedCaseId ? (
          <CaseDetails 
            caseId={selectedCaseId} 
            onBack={() => setActiveView('cases')} 
          />
        ) : (
          <CasesList onViewCase={handleViewCase} />
        );
      default:
        return <DashboardOverview onViewCase={handleViewCase} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const DashboardOverview: React.FC<{ onViewCase: (caseId: string) => void }> = ({ onViewCase }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Cases</p>
              <p className="text-2xl font-bold text-gray-900">47</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-success-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-warning-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-secondary-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Score Avg</p>
              <p className="text-2xl font-bold text-gray-900">0.12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Cases</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Loan Application #{1000 + i}
                    </p>
                    <p className="text-xs text-gray-600">
                      Created 2 hours ago
                    </p>
                  </div>
                </div>
                <span className="status-active">
                  In Review
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-800">
                <strong>85%</strong> of applications processed automatically today
              </p>
            </div>
            <div className="p-4 bg-success-50 rounded-lg">
              <p className="text-sm text-success-800">
                Average processing time reduced by <strong>40%</strong> this week
              </p>
            </div>
            <div className="p-4 bg-warning-50 rounded-lg">
              <p className="text-sm text-warning-800">
                <strong>3</strong> high-risk applications require manual review
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
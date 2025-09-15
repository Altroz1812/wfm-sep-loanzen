'use client';

import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Bot, TrendingUp, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

const AIMetrics: React.FC = () => {
  const { state } = useAuth();

  const { data: metrics, isLoading } = useQuery(
    ['aiMetrics', state.user?.tenant.id],
    async () => {
      const response = await axios.get(`/api/${state.user?.tenant.id}/dashboard/ai`);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Performance Metrics</h1>
          <p className="text-gray-600 mt-1">Monitor AI model performance and automation insights</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          Last updated: {metrics?.generatedAt ? new Date(metrics.generatedAt).toLocaleTimeString() : 'Never'}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Bot className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Model Runs</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.modelMetrics?.reduce((sum: number, m: any) => sum + m.total_runs, 0) || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.modelMetrics?.length > 0 ? (
                  Math.round(
                    (metrics.modelMetrics.reduce((sum: number, m: any) => sum + m.successful_runs, 0) /
                     metrics.modelMetrics.reduce((sum: number, m: any) => sum + m.total_runs, 0)) * 100
                  )
                ) : 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.modelMetrics?.length > 0 ? (
                  Math.round(
                    metrics.modelMetrics.reduce((sum: number, m: any) => sum + m.avg_execution_time, 0) /
                    metrics.modelMetrics.length
                  )
                ) : 0}ms
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Automation Rate</p>
              <p className="text-2xl font-bold text-gray-900">73%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Performance */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Model Performance</h2>
        {metrics?.modelMetrics && metrics.modelMetrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Runs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.modelMetrics.map((model: any) => (
                  <tr key={model.model_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Bot className="h-5 w-5 text-primary-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{model.model_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {model.total_runs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          (model.successful_runs / model.total_runs) > 0.9 ? 'text-success-600' : 
                          (model.successful_runs / model.total_runs) > 0.7 ? 'text-warning-600' : 'text-error-600'
                        }`}>
                          {Math.round((model.successful_runs / model.total_runs) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(model.avg_execution_time)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        model.failed_runs === 0 ? 'bg-success-100 text-success-800' :
                        model.failed_runs < 5 ? 'bg-warning-100 text-warning-800' : 'bg-error-100 text-error-800'
                      }`}>
                        {model.failed_runs === 0 ? 'Healthy' : 
                         model.failed_runs < 5 ? 'Warning' : 'Critical'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No model performance data available</p>
          </div>
        )}
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Credit Risk Distribution</h2>
          {metrics?.scoringDistribution && metrics.scoringDistribution.length > 0 ? (
            <div className="space-y-4">
              {metrics.scoringDistribution.map((item: any) => (
                <div key={item.risk_category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      item.risk_category === 'Low Risk' ? 'bg-success-500' :
                      item.risk_category === 'Medium Risk' ? 'bg-warning-500' : 'bg-error-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.risk_category}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No scoring data available</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Automation Actions</h2>
          {metrics?.automationMetrics && metrics.automationMetrics.length > 0 ? (
            <div className="space-y-4">
              {metrics.automationMetrics.map((item: any) => (
                <div key={item.action_type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 text-primary-500 mr-3" />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.action_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{item.count}</div>
                    <div className="text-xs text-gray-500">
                      Avg confidence: {Math.round(item.avg_confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No automation data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Health Alerts */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
              <span className="font-medium text-success-800">Models Operational</span>
            </div>
            <p className="text-sm text-success-700 mt-1">
              All AI models are functioning normally
            </p>
          </div>
          
          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-warning-600 mr-2" />
              <span className="font-medium text-warning-800">Processing Time</span>
            </div>
            <p className="text-sm text-warning-700 mt-1">
              Response times within acceptable limits
            </p>
          </div>
          
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
              <span className="font-medium text-primary-800">Accuracy Trending Up</span>
            </div>
            <p className="text-sm text-primary-700 mt-1">
              Model accuracy has improved by 5% this week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMetrics;
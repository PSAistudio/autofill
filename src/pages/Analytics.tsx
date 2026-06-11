import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import type { AnalyticsSummary } from '../types';

const DEMO_SUMMARY: AnalyticsSummary = {
  totalAutofills: 1284,
  totalAnalyses: 456,
  totalClassifications: 312,
  totalProfiles: 8,
  autofillsByDay: [
    { date: '2024-01-15', count: 42 },
    { date: '2024-01-16', count: 58 },
    { date: '2024-01-17', count: 35 },
    { date: '2024-01-18', count: 71 },
    { date: '2024-01-19', count: 63 },
    { date: '2024-01-20', count: 49 },
    { date: '2024-01-21', count: 55 },
  ],
  topFormTypes: [
    { type: 'Thai Government Form', count: 89 },
    { type: 'E-Commerce Checkout', count: 67 },
    { type: 'Job Application', count: 45 },
    { type: 'Hotel Booking', count: 38 },
    { type: 'Bank Application', count: 29 },
  ],
  languageDistribution: [
    { language: 'Thai', count: 156 },
    { language: 'English', count: 98 },
    { language: 'Mixed (TH/EN)', count: 58 },
  ],
  averageConfidence: 0.91,
};

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary>(DEMO_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await analyticsApi.getSummary();
        if (res.data) setSummary(res.data);
      } catch {
        // Use demo data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const maxAutofills = Math.max(...summary.autofillsByDay.map(d => d.count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Autofill usage insights and form classification metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-label">Total Autofills</div>
          <div className="stat-value text-primary-600">{summary.totalAutofills.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Forms Analyzed</div>
          <div className="stat-value text-blue-600">{summary.totalAnalyses.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Classifications</div>
          <div className="stat-value text-purple-600">{summary.totalClassifications.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Confidence</div>
          <div className="stat-value text-green-600">{(summary.averageConfidence * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Autofills Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Autofills Over Last 7 Days</h2>
        <div className="flex items-end gap-4 h-48">
          {summary.autofillsByDay.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-primary-400 rounded-t-lg transition-all duration-300 hover:bg-primary-600 min-h-[4px]"
                style={{ height: `${(day.count / maxAutofills) * 100}%` }}
              />
              <span className="text-xs text-gray-500">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
              <span className="text-xs font-medium text-gray-700">{day.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Form Types */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Form Types</h2>
          <div className="space-y-3">
            {summary.topFormTypes.map((item, i) => (
              <div key={item.type} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700">{item.type}</span>
                <span className="badge-info">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h2>
          <div className="space-y-4">
            {summary.languageDistribution.map(item => {
              const total = summary.languageDistribution.reduce((s, d) => s + d.count, 0);
              const pct = ((item.count / total) * 100).toFixed(0);
              return (
                <div key={item.language}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.language}</span>
                    <span className="text-gray-500">{pct}% ({item.count})</span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

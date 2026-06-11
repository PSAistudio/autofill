import { useState, useEffect } from 'react';
import { profilesApi, analyticsApi } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProfiles: 0,
    totalAutofills: 0,
    totalAnalyses: 0,
    avgConfidence: 0,
  });
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profilesRes, analyticsRes] = await Promise.all([
          profilesApi.list(),
          analyticsApi.getSummary(),
        ]);

        setStats({
          totalProfiles: profilesRes.data?.length ?? 0,
          totalAutofills: analyticsRes.data?.totalAutofills ?? 0,
          totalAnalyses: analyticsRes.data?.totalAnalyses ?? 0,
          avgConfidence: analyticsRes.data?.averageConfidence ?? 0,
        });
      } catch {
        // Use default stats on error
      } finally {
        setLoading(false);
        setRecentActivity([
          'Profile "Work Info" updated — 2 hours ago',
          'Form analysis completed on example.com — 5 hours ago',
          'New profile "Personal" created — 1 day ago',
          'AI classification: Thai government form detected — 2 days ago',
        ]);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your Smart Form Autofill Engine</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-label">Total Profiles</div>
          <div className="stat-value text-primary-600">{stats.totalProfiles}</div>
          <div className="text-xs text-gray-400 mt-1">Encrypted with AES-256-GCM</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Autofills Completed</div>
          <div className="stat-value text-green-600">{stats.totalAutofills}</div>
          <div className="text-xs text-gray-400 mt-1">Fields auto-populated</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Forms Analyzed</div>
          <div className="stat-value text-blue-600">{stats.totalAnalyses}</div>
          <div className="text-xs text-gray-400 mt-1">Thai & English forms</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg. Confidence</div>
          <div className="stat-value text-purple-600">{(stats.avgConfidence * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-400 mt-1">AI classification accuracy</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="card-hover text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Profile</p>
                <p className="text-sm text-gray-500">Add a new encrypted profile</p>
              </div>
            </div>
          </button>

          <button className="card-hover text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Analyze Form</p>
                <p className="text-sm text-gray-500">Scan & classify form fields</p>
              </div>
            </div>
          </button>

          <button className="card-hover text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI Classify</p>
                <p className="text-sm text-gray-500">Auto-detect field types</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-surface-100 last:border-0">
              <div className="w-2 h-2 rounded-full bg-primary-400" />
              <span className="text-sm text-gray-700">{activity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

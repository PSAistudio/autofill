import { useState, useEffect } from 'react';
import type { UserSettings } from '../types';
import { settingsApi } from '../services/api';

const DEFAULT_SETTINGS: UserSettings = {
  defaultLanguage: 'auto',
  autoClassify: true,
  encryptProfiles: true,
  theme: 'light',
  notifications: true,
  maxProfiles: 20,
};

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await settingsApi.get();
        if (res.data) setSettings(res.data);
      } catch {
        // Use default settings
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      await settingsApi.update(settings);
    } catch {
      // Save locally anyway
    }
    localStorage.setItem('autofill_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your autofill engine preferences</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          ✅ Settings saved successfully
        </div>
      )}

      {/* Language */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Language & Classification</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
            <select
              className="input-field max-w-xs"
              value={settings.defaultLanguage}
              onChange={e => updateSetting('defaultLanguage', e.target.value as UserSettings['defaultLanguage'])}
            >
              <option value="auto">Auto-detect</option>
              <option value="th">Thai (ไทย)</option>
              <option value="en">English</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Used for form classification rule engine</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto-Classify Forms</p>
              <p className="text-xs text-gray-400">Automatically classify form fields using AI</p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoClassify ? 'bg-primary-600' : 'bg-gray-300'
              }`}
              onClick={() => updateSetting('autoClassify', !settings.autoClassify)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoClassify ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security & Encryption</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Encrypt Profiles</p>
              <p className="text-xs text-gray-400">AES-256-GCM with PBKDF2 key derivation</p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.encryptProfiles ? 'bg-primary-600' : 'bg-gray-300'
              }`}
              onClick={() => updateSetting('encryptProfiles', !settings.encryptProfiles)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.encryptProfiles ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Profiles</label>
            <input
              type="number"
              className="input-field max-w-xs"
              min={1}
              max={100}
              value={settings.maxProfiles}
              onChange={e => updateSetting('maxProfiles', parseInt(e.target.value) || 20)}
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <select
              className="input-field max-w-xs"
              value={settings.theme}
              onChange={e => updateSetting('theme', e.target.value as UserSettings['theme'])}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Notifications</p>
              <p className="text-xs text-gray-400">Show alerts for autofill actions</p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications ? 'bg-primary-600' : 'bg-gray-300'
              }`}
              onClick={() => updateSetting('notifications', !settings.notifications)}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

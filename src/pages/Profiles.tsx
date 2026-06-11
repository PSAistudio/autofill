import { useState, useEffect } from 'react';
import type { Profile, ProfileField } from '../types';
import { encrypt, decrypt, generateId } from '../services/crypto';

const DEMO_FIELDS: ProfileField[] = [
  { key: 'firstName', label: 'First Name', value: '', type: 'text', category: 'personal' },
  { key: 'lastName', label: 'Last Name', value: '', type: 'text', category: 'personal' },
  { key: 'email', label: 'Email', value: '', type: 'email', category: 'contact' },
  { key: 'phone', label: 'Phone', value: '', type: 'tel', category: 'contact' },
  { key: 'address', label: 'Address', value: '', type: 'textarea', category: 'address' },
  { key: 'city', label: 'City', value: '', type: 'text', category: 'address' },
  { key: 'company', label: 'Company', value: '', type: 'text', category: 'work' },
  { key: 'jobTitle', label: 'Job Title', value: '', type: 'text', category: 'work' },
  { key: 'website', label: 'Website', value: '', type: 'url', category: 'contact' },
  { key: 'birthdate', label: 'Birthdate', value: '', type: 'date', category: 'personal' },
];

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [fields, setFields] = useState<ProfileField[]>(DEMO_FIELDS);
  const [masterPassword, setMasterPassword] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileTags, setNewProfileTags] = useState('');
  const [decrypted, setDecrypted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('autofill_profiles');
    if (stored) {
      try {
        setProfiles(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const saveProfiles = (updated: Profile[]) => {
    setProfiles(updated);
    localStorage.setItem('autofill_profiles', JSON.stringify(updated));
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setError('Profile name is required');
      return;
    }
    if (!masterPassword.trim()) {
      setError('Master password is required for encryption');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToEncrypt = JSON.stringify(fields.filter(f => f.value.trim()));
      const { encrypted, iv, salt } = await encrypt(dataToEncrypt, masterPassword);

      const newProfile: Profile = {
        id: generateId(),
        name: newProfileName.trim(),
        encryptedData: encrypted,
        iv,
        salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fieldCount: fields.filter(f => f.value.trim()).length,
        tags: newProfileTags.split(',').map(t => t.trim()).filter(Boolean),
      };

      saveProfiles([...profiles, newProfile]);
      setShowCreate(false);
      setNewProfileName('');
      setNewProfileTags('');
      setFields(DEMO_FIELDS.map(f => ({ ...f, value: '' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async (profile: Profile) => {
    if (!masterPassword.trim()) {
      setError('Enter master password to decrypt');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const json = await decrypt(profile.encryptedData, profile.iv, profile.salt, masterPassword);
      const decryptedFields: ProfileField[] = JSON.parse(json);
      setFields(decryptedFields);
      setSelectedProfile(profile);
      setDecrypted(true);
    } catch {
      setError('Decryption failed — wrong password or corrupted data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = (id: string) => {
    saveProfiles(profiles.filter(p => p.id !== id));
    if (selectedProfile?.id === id) {
      setSelectedProfile(null);
      setDecrypted(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
          <p className="text-gray-500 mt-1">Zero-Knowledge encrypted profile management</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + New Profile
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Master Password */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">Master Password</label>
        <input
          type="password"
          className="input-field max-w-md"
          placeholder="Enter master password to encrypt/decrypt profiles"
          value={masterPassword}
          onChange={e => setMasterPassword(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-2">
          🔒 Used to derive AES-256-GCM key via PBKDF2 (600,000 iterations)
        </p>
      </div>

      {/* Create Profile Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Personal, Work, Thai Government"
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., personal, thailand, work"
                  value={newProfileTags}
                  onChange={e => setNewProfileTags(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Fields</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                      <input
                        type={field.type === 'textarea' ? 'text' : field.type}
                        className="input-field text-sm"
                        placeholder={field.label}
                        value={field.value}
                        onChange={e => setFields(fields.map(f => f.key === field.key ? { ...f, value: e.target.value } : f))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateProfile} disabled={loading}>
                {loading ? 'Encrypting...' : 'Encrypt & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <div key={profile.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{profile.name}</h3>
              <span className="badge-info">{profile.fieldCount} fields</span>
            </div>
            <div className="flex gap-2 mb-3">
              {profile.tags.map(tag => (
                <span key={tag} className="badge-success">{tag}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Updated: {new Date(profile.updatedAt).toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-primary text-sm px-3 py-1.5"
                onClick={() => handleDecrypt(profile)}
                disabled={loading}
              >
                🔓 Decrypt
              </button>
              <button
                className="btn-danger text-sm px-3 py-1.5"
                onClick={() => handleDeleteProfile(profile.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {profiles.length === 0 && (
          <div className="col-span-3 card text-center py-12">
            <p className="text-gray-400 text-lg">No profiles yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first encrypted profile to get started</p>
          </div>
        )}
      </div>

      {/* Decrypted View */}
      {decrypted && selectedProfile && (
        <div className="card border-green-200 bg-green-50/50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔓 Decrypted: {selectedProfile.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.filter(f => f.value).map(field => (
              <div key={field.key} className="bg-white rounded-xl p-3 border border-green-200">
                <span className="text-xs font-medium text-gray-500">{field.label}</span>
                <p className="text-sm text-gray-900 mt-0.5">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

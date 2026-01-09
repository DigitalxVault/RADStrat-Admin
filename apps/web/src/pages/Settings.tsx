import { useState, useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import type { Profile } from '../types';

type TabType = 'profiles' | 'evaluator' | 'about';

function Settings() {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    resetToDefaults
  } = useProfile();

  const [activeTab, setActiveTab] = useState<TabType>('profiles');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const defaultProfileIds = ['near-fetch', 'far-fetch', 'strict'];

  const handleEditProfile = useCallback((profile: Profile) => {
    setEditingProfile({ ...profile });
    setIsCreating(false);
  }, []);

  const handleCreateProfile = useCallback(() => {
    const newProfile: Profile = {
      id: `custom-${Date.now()}`,
      name: 'New Profile',
      description: 'Custom profile',
      weights: { accuracy: 0.5, fluency: 0.3, structure: 0.2 },
      benchmarks: {
        passMarkOverall: 70,
        minPerSection: { accuracy: 60, fluency: 50, structure: 50 }
      },
      fluency: {
        fillerWords: ['um', 'uh', 'er', 'ah', 'like', 'you know'],
        fillerPenaltyPerWord: 2,
        fillerPenaltyCap: 15,
        pauseThresholdMs: 500,
        longPauseThresholdMs: 1500,
        pausePenalty: 1,
        longPausePenalty: 3
      },
      normalization: {
        digitWordEquivalence: true,
        rtNumberVariants: true,
        ignorePunctuation: true
      },
      evaluator: {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        scoringPromptTemplate: 'Evaluate the student response against the expected answer. Provide scores for accuracy, fluency, and structure.',
        explanationPromptTemplate: 'Explain what was good and what needs improvement.'
      }
    };
    setEditingProfile(newProfile);
    setIsCreating(true);
  }, []);

  const handleSaveProfile = useCallback(() => {
    if (!editingProfile) return;

    if (isCreating) {
      addProfile(editingProfile);
    } else {
      updateProfile(editingProfile.id, editingProfile);
    }
    setEditingProfile(null);
    setIsCreating(false);
  }, [editingProfile, isCreating, addProfile, updateProfile]);

  const handleDeleteProfile = useCallback((profileId: string) => {
    deleteProfile(profileId);
    setShowDeleteConfirm(null);
  }, [deleteProfile]);

  const handleResetDefaults = useCallback(() => {
    if (confirm('Reset all profiles to defaults? This will remove custom profiles.')) {
      resetToDefaults();
    }
  }, [resetToDefaults]);

  const updateEditingProfile = useCallback(<K extends keyof Profile>(
    key: K,
    value: Profile[K]
  ) => {
    if (!editingProfile) return;
    setEditingProfile({ ...editingProfile, [key]: value });
  }, [editingProfile]);

  return (
    <div className="flex flex-col gap-lg">
      {/* Tab Navigation */}
      <div className="ink-bar">
        <div className="flex gap-md">
          {(['profiles', 'evaluator', 'about'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="flex flex-col gap-lg">
          {/* Profile List */}
          <div className="paper-card">
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
              <h4>Scoring Profiles</h4>
              <div className="flex gap-sm">
                <button className="btn btn-secondary" onClick={handleCreateProfile}>
                  + New Profile
                </button>
                <button className="btn btn-ghost" onClick={handleResetDefaults}>
                  Reset Defaults
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className="paper-card-2 flex justify-between items-center"
                  style={{
                    border: activeProfileId === profile.id ? '2px solid var(--accent-yellow)' : undefined
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-sm">
                      <strong>{profile.name}</strong>
                      {defaultProfileIds.includes(profile.id) && (
                        <span className="mono text-small text-muted">(default)</span>
                      )}
                      {activeProfileId === profile.id && (
                        <span
                          className="mono text-small"
                          style={{
                            background: 'var(--accent-yellow)',
                            color: 'var(--text-ink)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)'
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-small text-muted">{profile.description}</p>
                    <div className="mono text-small" style={{ marginTop: 'var(--space-xs)' }}>
                      Pass: {profile.benchmarks.passMarkOverall}% |
                      A:{Math.round(profile.weights.accuracy * 100)}%
                      F:{Math.round(profile.weights.fluency * 100)}%
                      S:{Math.round(profile.weights.structure * 100)}%
                    </div>
                  </div>

                  <div className="flex gap-sm">
                    {activeProfileId !== profile.id && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => setActiveProfileId(profile.id)}
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEditProfile(profile)}
                    >
                      Edit
                    </button>
                    {!defaultProfileIds.includes(profile.id) && (
                      <button
                        className="btn btn-danger"
                        onClick={() => setShowDeleteConfirm(profile.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit/Create Profile Modal */}
          {editingProfile && (
            <ProfileEditor
              profile={editingProfile}
              isCreating={isCreating}
              onUpdate={updateEditingProfile}
              onSave={handleSaveProfile}
              onCancel={() => { setEditingProfile(null); setIsCreating(false); }}
            />
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={() => setShowDeleteConfirm(null)}
            >
              <div
                className="paper-card"
                style={{ maxWidth: '400px' }}
                onClick={e => e.stopPropagation()}
              >
                <h4 style={{ marginBottom: 'var(--space-md)' }}>Delete Profile?</h4>
                <p>This action cannot be undone.</p>
                <div className="flex gap-sm justify-end" style={{ marginTop: 'var(--space-lg)' }}>
                  <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteProfile(showDeleteConfirm)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evaluator Tab */}
      {activeTab === 'evaluator' && activeProfile && (
        <div className="paper-card">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>Evaluator Configuration</h4>
          <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
            Current profile: <strong>{activeProfile.name}</strong>
          </p>

          <div className="grid gap-md" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">Model</label>
              <p className="mono">{activeProfile.evaluator.model}</p>
            </div>
            <div>
              <label className="label">Temperature</label>
              <p className="mono">{activeProfile.evaluator.temperature}</p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-lg)' }}>
            <label className="label">Scoring Prompt Template</label>
            <div className="paper-card-2">
              <pre className="mono text-small" style={{ whiteSpace: 'pre-wrap' }}>
                {activeProfile.evaluator.scoringPromptTemplate}
              </pre>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <label className="label">Explanation Prompt Template</label>
            <div className="paper-card-2">
              <pre className="mono text-small" style={{ whiteSpace: 'pre-wrap' }}>
                {activeProfile.evaluator.explanationPromptTemplate}
              </pre>
            </div>
          </div>

          <p className="text-small text-muted" style={{ marginTop: 'var(--space-lg)' }}>
            Edit the active profile in the Profiles tab to modify these settings.
          </p>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="paper-card">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>STT Tuning Console</h4>

          <div className="flex flex-col gap-md">
            <div>
              <label className="label">Version</label>
              <p className="mono">1.0.0</p>
            </div>

            <div>
              <label className="label">Description</label>
              <p>
                A tuning and testing console for speech-to-text evaluation in
                radio/telephone communication training scenarios.
              </p>
            </div>

            <div>
              <label className="label">Features</label>
              <ul style={{ paddingLeft: 'var(--space-lg)', margin: 0 }}>
                <li>Real-time speech transcription via OpenAI Realtime API</li>
                <li>LLM-based scoring (Accuracy, Fluency, Structure)</li>
                <li>Customizable evaluation profiles</li>
                <li>Question bank management</li>
                <li>Session telemetry and logging</li>
                <li>Export capabilities (JSON/CSV)</li>
              </ul>
            </div>

            <div>
              <label className="label">Technology Stack</label>
              <p className="mono text-small">
                React + TypeScript + Vite | Node.js + Express | OpenAI APIs
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Profile Editor Component
interface ProfileEditorProps {
  profile: Profile;
  isCreating: boolean;
  onUpdate: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}

function ProfileEditor({ profile, isCreating, onUpdate, onSave, onCancel }: ProfileEditorProps) {
  const [activeSection, setActiveSection] = useState<'basic' | 'weights' | 'fluency' | 'evaluator'>('basic');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-lg)'
      }}
      onClick={onCancel}
    >
      <div
        className="paper-card"
        style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
          <h4>{isCreating ? 'Create Profile' : 'Edit Profile'}</h4>
          <button className="btn btn-ghost" onClick={onCancel}>Close</button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-sm" style={{ marginBottom: 'var(--space-lg)' }}>
          {(['basic', 'weights', 'fluency', 'evaluator'] as const).map(section => (
            <button
              key={section}
              className={`btn ${activeSection === section ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setActiveSection(section)}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>

        {/* Basic Section */}
        {activeSection === 'basic' && (
          <div className="flex flex-col gap-md">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                value={profile.name}
                onChange={e => onUpdate('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={profile.description || ''}
                onChange={e => onUpdate('description', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Pass Mark (Overall)</label>
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                value={profile.benchmarks.passMarkOverall}
                onChange={e => onUpdate('benchmarks', {
                  ...profile.benchmarks,
                  passMarkOverall: parseInt(e.target.value) || 0
                })}
              />
            </div>
          </div>
        )}

        {/* Weights Section */}
        {activeSection === 'weights' && (
          <div className="flex flex-col gap-md">
            <p className="text-small text-muted">
              Weights must sum to 1.0 (100%). These determine how much each category
              contributes to the overall score.
            </p>
            {(['accuracy', 'fluency', 'structure'] as const).map(key => (
              <div key={key}>
                <label className="label">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Weight (%)
                </label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={100}
                  value={Math.round(profile.weights[key] * 100)}
                  onChange={e => onUpdate('weights', {
                    ...profile.weights,
                    [key]: (parseInt(e.target.value) || 0) / 100
                  })}
                />
              </div>
            ))}
            <div className="ink-bar">
              <span className="mono">
                Total: {Math.round((profile.weights.accuracy + profile.weights.fluency + profile.weights.structure) * 100)}%
              </span>
              {Math.abs(profile.weights.accuracy + profile.weights.fluency + profile.weights.structure - 1) > 0.01 && (
                <span style={{ color: 'var(--accent-danger)', marginLeft: 'var(--space-sm)' }}>
                  (Should be 100%)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fluency Section */}
        {activeSection === 'fluency' && (
          <div className="flex flex-col gap-md">
            <div className="grid gap-md" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label className="label">Filler Penalty (per word)</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={10}
                  step={0.5}
                  value={profile.fluency.fillerPenaltyPerWord}
                  onChange={e => onUpdate('fluency', {
                    ...profile.fluency,
                    fillerPenaltyPerWord: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <label className="label">Filler Penalty Cap</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={50}
                  value={profile.fluency.fillerPenaltyCap}
                  onChange={e => onUpdate('fluency', {
                    ...profile.fluency,
                    fillerPenaltyCap: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <label className="label">Pause Threshold (ms)</label>
                <input
                  type="number"
                  className="input"
                  min={100}
                  max={2000}
                  step={100}
                  value={profile.fluency.pauseThresholdMs}
                  onChange={e => onUpdate('fluency', {
                    ...profile.fluency,
                    pauseThresholdMs: parseInt(e.target.value) || 500
                  })}
                />
              </div>
              <div>
                <label className="label">Long Pause Threshold (ms)</label>
                <input
                  type="number"
                  className="input"
                  min={500}
                  max={5000}
                  step={100}
                  value={profile.fluency.longPauseThresholdMs}
                  onChange={e => onUpdate('fluency', {
                    ...profile.fluency,
                    longPauseThresholdMs: parseInt(e.target.value) || 1500
                  })}
                />
              </div>
              <div>
                <label className="label">Pause Penalty</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={10}
                  step={0.5}
                  value={profile.fluency.pausePenalty}
                  onChange={e => onUpdate('fluency', {
                    ...profile.fluency,
                    pausePenalty: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <label className="label">Long Pause Penalty</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={20}
                  step={0.5}
                  value={profile.fluency.longPausePenalty}
                  onChange={e => onUpdate('fluency', {
                    ...profile.fluency,
                    longPausePenalty: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
            <div>
              <label className="label">Filler Words (comma-separated)</label>
              <input
                type="text"
                className="input"
                value={profile.fluency.fillerWords.join(', ')}
                onChange={e => onUpdate('fluency', {
                  ...profile.fluency,
                  fillerWords: e.target.value.split(',').map(w => w.trim()).filter(w => w)
                })}
              />
            </div>
          </div>
        )}

        {/* Evaluator Section */}
        {activeSection === 'evaluator' && (
          <div className="flex flex-col gap-md">
            <div className="grid gap-md" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label className="label">Model</label>
                <select
                  className="input select"
                  value={profile.evaluator.model}
                  onChange={e => onUpdate('evaluator', {
                    ...profile.evaluator,
                    model: e.target.value
                  })}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                </select>
              </div>
              <div>
                <label className="label">Temperature</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  max={1}
                  step={0.1}
                  value={profile.evaluator.temperature}
                  onChange={e => onUpdate('evaluator', {
                    ...profile.evaluator,
                    temperature: parseFloat(e.target.value) || 0.3
                  })}
                />
              </div>
            </div>
            <div>
              <label className="label">Scoring Prompt Template</label>
              <textarea
                className="input"
                rows={6}
                value={profile.evaluator.scoringPromptTemplate}
                onChange={e => onUpdate('evaluator', {
                  ...profile.evaluator,
                  scoringPromptTemplate: e.target.value
                })}
              />
            </div>
            <div>
              <label className="label">Explanation Prompt Template</label>
              <textarea
                className="input"
                rows={3}
                value={profile.evaluator.explanationPromptTemplate}
                onChange={e => onUpdate('evaluator', {
                  ...profile.evaluator,
                  explanationPromptTemplate: e.target.value
                })}
              />
            </div>
          </div>
        )}

        {/* Save/Cancel Buttons */}
        <div className="flex gap-sm justify-end" style={{ marginTop: 'var(--space-lg)' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            {isCreating ? 'Create Profile' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;

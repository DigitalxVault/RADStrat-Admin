import { useState, useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import type { Profile } from '../types';

function Parameters() {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    updateProfile,
    resetToDefaults,
    exportProfile,
    importProfile
  } = useProfile();

  const [importError, setImportError] = useState<string | null>(null);

  const handleUpdateProfile = useCallback((updates: Partial<Profile>) => {
    if (!activeProfile) return;
    updateProfile(activeProfileId, { ...activeProfile, ...updates });
  }, [activeProfile, activeProfileId, updateProfile]);

  const handleWeightChange = (key: keyof Profile['weights'], value: number) => {
    if (!activeProfile) return;
    handleUpdateProfile({
      weights: { ...activeProfile.weights, [key]: value }
    });
  };

  const handleFluencyChange = (key: keyof Profile['fluency'], value: number | string[]) => {
    if (!activeProfile) return;
    handleUpdateProfile({
      fluency: { ...activeProfile.fluency, [key]: value }
    });
  };

  const handleNormalizationChange = (key: keyof Profile['normalization'], value: boolean) => {
    if (!activeProfile) return;
    handleUpdateProfile({
      normalization: { ...activeProfile.normalization, [key]: value }
    });
  };

  const handleBenchmarkChange = (value: number) => {
    if (!activeProfile) return;
    handleUpdateProfile({
      benchmarks: { ...activeProfile.benchmarks, passMarkOverall: value }
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importProfile(data);
      setImportError(null);
    } catch {
      setImportError('Invalid profile JSON');
    }
  };

  const handleExport = () => {
    if (!activeProfile) return;
    const profileData = exportProfile(activeProfileId);
    if (!profileData) return;
    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-${activeProfile.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeProfile) {
    return (
      <div className="paper-card">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Profile Selector */}
      <div className="paper-card">
        <div className="flex justify-between items-center">
          <div>
            <label htmlFor="active-profile" className="label">Active Profile</label>
            <select
              id="active-profile"
              name="active-profile"
              className="input select"
              value={activeProfileId}
              onChange={(e) => setActiveProfileId(e.target.value)}
              style={{ maxWidth: '300px' }}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-sm">
            <button className="btn btn-secondary" onClick={handleExport}>
              Export
            </button>
            <label htmlFor="import-profile" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Import
              <input
                id="import-profile"
                name="import-profile"
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button className="btn btn-secondary" onClick={resetToDefaults}>
              Reset All
            </button>
          </div>
        </div>

        {importError && (
          <p style={{ color: 'var(--accent-danger)', marginTop: 'var(--space-sm)' }}>
            {importError}
          </p>
        )}

        {activeProfile.description && (
          <p className="text-muted" style={{ marginTop: 'var(--space-sm)' }}>
            {activeProfile.description}
          </p>
        )}

        <p className="text-small text-muted" style={{ marginTop: 'var(--space-sm)' }}>
          Changes are saved automatically.
        </p>
      </div>

      {/* Weights */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Scoring Weights</h4>
        <div className="grid grid-cols-3 gap-md">
          {(['accuracy', 'fluency', 'structure'] as const).map((key) => (
            <div key={key}>
              <label htmlFor={`weight-${key}`} className="label">
                {key.charAt(0).toUpperCase() + key.slice(1)} ({Math.round(activeProfile.weights[key] * 100)}%)
              </label>
              <input
                id={`weight-${key}`}
                name={`weight-${key}`}
                type="range"
                min="0"
                max="100"
                value={activeProfile.weights[key] * 100}
                onChange={(e) => handleWeightChange(key, parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>
          ))}
        </div>
        <p className="text-small text-muted" style={{ marginTop: 'var(--space-sm)' }}>
          Total: {Math.round((activeProfile.weights.accuracy + activeProfile.weights.fluency + activeProfile.weights.structure) * 100)}%
          {Math.abs(activeProfile.weights.accuracy + activeProfile.weights.fluency + activeProfile.weights.structure - 1) > 0.01 && (
            <span style={{ color: 'var(--accent-danger)' }}> (should equal 100%)</span>
          )}
        </p>
      </div>

      {/* Fluency Settings */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Fluency Settings</h4>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label htmlFor="pause-threshold" className="label">Pause Threshold (ms)</label>
            <input
              id="pause-threshold"
              name="pause-threshold"
              type="number"
              className="input"
              value={activeProfile.fluency.pauseThresholdMs}
              onChange={(e) => handleFluencyChange('pauseThresholdMs', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="long-pause-threshold" className="label">Long Pause Threshold (ms)</label>
            <input
              id="long-pause-threshold"
              name="long-pause-threshold"
              type="number"
              className="input"
              value={activeProfile.fluency.longPauseThresholdMs}
              onChange={(e) => handleFluencyChange('longPauseThresholdMs', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="filler-penalty" className="label">Filler Penalty Per Word</label>
            <input
              id="filler-penalty"
              name="filler-penalty"
              type="number"
              step="0.1"
              className="input"
              value={activeProfile.fluency.fillerPenaltyPerWord}
              onChange={(e) => handleFluencyChange('fillerPenaltyPerWord', parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="filler-penalty-cap" className="label">Filler Penalty Cap</label>
            <input
              id="filler-penalty-cap"
              name="filler-penalty-cap"
              type="number"
              className="input"
              value={activeProfile.fluency.fillerPenaltyCap}
              onChange={(e) => handleFluencyChange('fillerPenaltyCap', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="pause-penalty" className="label">Pause Penalty</label>
            <input
              id="pause-penalty"
              name="pause-penalty"
              type="number"
              step="0.1"
              className="input"
              value={activeProfile.fluency.pausePenalty}
              onChange={(e) => handleFluencyChange('pausePenalty', parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="long-pause-penalty" className="label">Long Pause Penalty</label>
            <input
              id="long-pause-penalty"
              name="long-pause-penalty"
              type="number"
              step="0.1"
              className="input"
              value={activeProfile.fluency.longPausePenalty}
              onChange={(e) => handleFluencyChange('longPausePenalty', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-md)' }}>
          <label htmlFor="filler-words" className="label">Filler Words (comma-separated)</label>
          <input
            id="filler-words"
            name="filler-words"
            type="text"
            className="input input-mono"
            value={activeProfile.fluency.fillerWords.join(', ')}
            onChange={(e) => handleFluencyChange(
              'fillerWords',
              e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
            )}
          />
        </div>
      </div>

      {/* Normalization */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Normalization</h4>
        <div className="flex flex-col gap-sm">
          {[
            { key: 'digitWordEquivalence', label: 'Digit/Word Equivalence (1 = one)' },
            { key: 'rtNumberVariants', label: 'R/T Number Variants (niner, tree, fife)' },
            { key: 'ignorePunctuation', label: 'Ignore Punctuation' }
          ].map(({ key, label }) => (
            <label key={key} htmlFor={`norm-${key}`} className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
              <input
                id={`norm-${key}`}
                name={`norm-${key}`}
                type="checkbox"
                checked={activeProfile.normalization[key as keyof Profile['normalization']]}
                onChange={(e) => handleNormalizationChange(
                  key as keyof Profile['normalization'],
                  e.target.checked
                )}
              />
              <span style={{ color: 'var(--accent-yellow)' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Benchmark */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Pass Benchmark</h4>
        <div style={{ maxWidth: '200px' }}>
          <label htmlFor="pass-mark" className="label">Pass Mark (Overall %)</label>
          <input
            id="pass-mark"
            name="pass-mark"
            type="number"
            min="0"
            max="100"
            className="input"
            value={activeProfile.benchmarks.passMarkOverall}
            onChange={(e) => handleBenchmarkChange(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

export default Parameters;

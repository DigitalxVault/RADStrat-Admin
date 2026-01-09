import { useState, useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import type { Profile } from '../types';

function Prompts() {
  const { activeProfile, activeProfileId, updateProfile } = useProfile();
  const [previewPayload, setPreviewPayload] = useState<string | null>(null);

  const handleUpdateProfile = useCallback((evaluatorUpdates: Partial<Profile['evaluator']>) => {
    if (!activeProfile) return;
    updateProfile(activeProfileId, {
      ...activeProfile,
      evaluator: { ...activeProfile.evaluator, ...evaluatorUpdates }
    });
  }, [activeProfile, activeProfileId, updateProfile]);

  if (!activeProfile) {
    return (
      <div className="paper-card">
        <p>Loading profile...</p>
      </div>
    );
  }

  const handleScoringPromptChange = (value: string) => {
    handleUpdateProfile({ scoringPromptTemplate: value });
  };

  const handleExplanationPromptChange = (value: string) => {
    handleUpdateProfile({ explanationPromptTemplate: value });
  };

  const handleModelChange = (value: string) => {
    handleUpdateProfile({ model: value });
  };

  const handleTemperatureChange = (value: number) => {
    handleUpdateProfile({ temperature: value });
  };

  const handlePreview = () => {
    const payload = {
      model: activeProfile.evaluator.model,
      temperature: activeProfile.evaluator.temperature,
      messages: [
        {
          role: 'system',
          content: `[SCORING PROMPT]\n${activeProfile.evaluator.scoringPromptTemplate}`
        },
        {
          role: 'user',
          content: `[EXPLANATION PROMPT]\n${activeProfile.evaluator.explanationPromptTemplate}\n\n[Data would be inserted here...]`
        }
      ],
      note: 'API key and actual data redacted for preview'
    };
    setPreviewPayload(JSON.stringify(payload, null, 2));
  };

  const handleValidateSchema = () => {
    // Check if prompts contain expected keywords
    const requiredTerms = ['accuracyScore', 'fluencyScore', 'structureScore', 'overallScore', 'reasons'];
    const scoringPrompt = activeProfile.evaluator.scoringPromptTemplate.toLowerCase();
    const missing = requiredTerms.filter(term =>
      !scoringPrompt.includes(term.toLowerCase())
    );

    if (missing.length > 0) {
      alert(`Warning: Scoring prompt may be missing references to: ${missing.join(', ')}`);
    } else {
      alert('Schema validation passed! Prompt includes all expected output fields.');
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Model Settings */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Evaluator Model</h4>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label htmlFor="evaluator-model" className="label">Model</label>
            <select
              id="evaluator-model"
              name="evaluator-model"
              className="input select"
              value={activeProfile.evaluator.model}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Fast, Cheap)</option>
              <option value="gpt-4o">GPT-4o (Best Quality)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</option>
            </select>
          </div>
          <div>
            <label htmlFor="evaluator-temperature" className="label">Temperature ({activeProfile.evaluator.temperature})</label>
            <input
              id="evaluator-temperature"
              name="evaluator-temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={activeProfile.evaluator.temperature}
              onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-small text-muted">
              Lower = more deterministic, Higher = more creative
            </p>
          </div>
        </div>
      </div>

      {/* Scoring Prompt */}
      <div className="paper-card">
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
          <h4>Scoring Prompt Template</h4>
          <button className="btn btn-secondary" onClick={handleValidateSchema}>
            Validate Schema
          </button>
        </div>
        <p className="text-small text-muted" style={{ marginBottom: 'var(--space-sm)' }}>
          This prompt instructs the LLM how to evaluate and score responses.
          The system will inject weights, thresholds, and data automatically.
        </p>
        <textarea
          id="scoring-prompt"
          name="scoring-prompt"
          className="input textarea input-mono"
          value={activeProfile.evaluator.scoringPromptTemplate}
          onChange={(e) => handleScoringPromptChange(e.target.value)}
          rows={12}
          placeholder="Enter your scoring prompt template..."
          aria-label="Scoring prompt template"
        />
      </div>

      {/* Explanation Prompt */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Explanation Prompt Template</h4>
        <p className="text-small text-muted" style={{ marginBottom: 'var(--space-sm)' }}>
          Additional instructions for generating "why not 100%" explanations.
          This is appended to the user message.
        </p>
        <textarea
          id="explanation-prompt"
          name="explanation-prompt"
          className="input textarea input-mono"
          value={activeProfile.evaluator.explanationPromptTemplate}
          onChange={(e) => handleExplanationPromptChange(e.target.value)}
          rows={8}
          placeholder="Enter your explanation prompt template..."
          aria-label="Explanation prompt template"
        />
      </div>

      {/* Actions */}
      <div className="paper-card">
        <div className="flex gap-md">
          <button className="btn btn-secondary" onClick={handlePreview}>
            Preview Payload
          </button>
          <p className="text-small text-muted" style={{ alignSelf: 'center' }}>
            Changes are saved automatically.
          </p>
        </div>
      </div>

      {/* Preview */}
      {previewPayload && (
        <div className="paper-card">
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
            <h4>Request Payload Preview</h4>
            <button
              className="btn btn-ghost text-small"
              onClick={() => setPreviewPayload(null)}
            >
              Close
            </button>
          </div>
          <pre
            className="mono text-small"
            style={{
              background: 'var(--surface-ink)',
              color: 'var(--text-on-dark)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              overflow: 'auto',
              maxHeight: '400px'
            }}
          >
            {previewPayload}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Prompts;

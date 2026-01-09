import { useState, useRef } from 'react';
import type { QuestionBank } from '../types';

interface QuestionBankLoaderProps {
  onLoad: (data: QuestionBank) => void;
  onLoadJSON: (json: string) => boolean;
  error: string | null;
}

function QuestionBankLoader({ onLoad, onLoadJSON, error }: QuestionBankLoaderProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [jsonInput, setJsonInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      const success = onLoadJSON(text);
      if (success) {
        setJsonInput('');
      }
    } catch {
      // Error will be set by parent
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handlePasteSubmit = () => {
    if (jsonInput.trim()) {
      onLoadJSON(jsonInput);
    }
  };

  const loadSampleData = async () => {
    try {
      const response = await fetch('/src/data/sample_question_bank.json');
      if (response.ok) {
        const data = await response.json();
        onLoad(data);
      }
    } catch {
      // Try importing directly
      import('../data/sample_question_bank.json').then(module => {
        onLoad(module.default as QuestionBank);
      });
    }
  };

  return (
    <div className="paper-card">
      <h4 style={{ marginBottom: 'var(--space-md)' }}>Load Question Bank</h4>

      <div className="flex gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
        <button
          className={`btn ${mode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('upload')}
        >
          Upload File
        </button>
        <button
          className={`btn ${mode === 'paste' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('paste')}
        >
          Paste JSON
        </button>
        <button
          className="btn btn-secondary"
          onClick={loadSampleData}
        >
          Load Sample
        </button>
      </div>

      {error && (
        <div
          className="ink-bar"
          style={{
            marginBottom: 'var(--space-md)',
            background: 'var(--accent-danger)',
            color: 'white'
          }}
        >
          {error}
        </div>
      )}

      {mode === 'upload' ? (
        <div
          className="paper-card-2"
          style={{
            padding: 'var(--space-xl)',
            textAlign: 'center',
            border: dragOver ? '2px dashed var(--accent-yellow)' : '2px dashed var(--stroke)',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <p style={{ marginBottom: 'var(--space-sm)' }}>
            Drop a JSON file here or click to browse
          </p>
          <p className="text-small text-muted">
            Accepts .json files with question bank format
          </p>
        </div>
      ) : (
        <div>
          <textarea
            className="input textarea input-mono"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"meta": {...}, "questions": [...]}'
            rows={10}
          />
          <button
            className="btn btn-primary"
            onClick={handlePasteSubmit}
            disabled={!jsonInput.trim()}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            Load JSON
          </button>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-md)' }}>
        <details>
          <summary className="mono text-small" style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
            Question Bank Format Reference
          </summary>
          <pre
            className="mono text-small"
            style={{
              marginTop: 'var(--space-sm)',
              padding: 'var(--space-md)',
              background: 'var(--surface-ink)',
              color: 'var(--text-on-dark)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'auto'
            }}
          >
{`{
  "meta": {
    "version": "1.0",
    "title": "Question Bank Title"
  },
  "questions": [
    {
      "id": "q-001",
      "scenarioPrompt": "Your scenario...",
      "expectedAnswer": {
        "text": "Expected response",
        "variants": ["Alternative 1"]
      },
      "tags": ["category"],
      "hints": ["Hint 1"]
    }
  ]
}`}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default QuestionBankLoader;

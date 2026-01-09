import { useCallback, useEffect } from 'react';
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProfile } from '../hooks/useProfile';
import { useSTTSession } from '../hooks/useSTTSession';
import { useTelemetry } from '../hooks/useTelemetry';
import TranscriptDisplay from '../components/TranscriptDisplay';
import ScoreDisplay from '../components/ScoreDisplay';
import TelemetryStrip from '../components/TelemetryStrip';
import type { TestRun } from '../types';

// SVG Icons
const MicrophoneIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
  </svg>
);

const NextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
  </svg>
);

const PreviousIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
  </svg>
);

const ShuffleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
  </svg>
);

const StopIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12v12H6z"/>
  </svg>
);

function STTTest() {
  const {
    questions,
    currentQuestion,
    currentIndex,
    nextQuestion,
    previousQuestion,
    shuffleQuestions,
    isLoaded,
    error: questionError
  } = useQuestionBank();

  const { activeProfile, profiles, activeProfileId, setActiveProfileId } = useProfile();
  const { addRun } = useTelemetry();

  const handleRunComplete = useCallback((run: TestRun) => {
    addRun(run);
  }, [addRun]);

  const {
    status,
    interimTranscript,
    finalTranscript,
    scoreResult,
    error: sessionError,
    startSession,
    stopSession,
    isRecording,
    telemetry,
    preConnect
  } = useSTTSession(handleRunComplete);

  // Pre-connect: mint token in advance when profile is available for faster startup
  useEffect(() => {
    if (activeProfile) {
      preConnect();
    }
  }, [activeProfile, preConnect]);

  const canRecord = currentQuestion && activeProfile && status === 'idle';
  const isProcessing = status === 'processing' || status === 'connecting';

  const handleStartRecording = useCallback(async () => {
    if (!currentQuestion || !activeProfile) return;
    await startSession(currentQuestion, activeProfile);
  }, [currentQuestion, activeProfile, startSession]);

  const handleStopRecording = useCallback(() => {
    stopSession();
  }, [stopSession]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="paper-card text-center" style={{ maxWidth: '500px' }}>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>Loading Question Bank...</h3>
          {questionError && (
            <p style={{ color: 'var(--accent-danger)' }}>{questionError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Header Bar with Profile & Telemetry */}
      <div className="ink-bar flex justify-between items-start">
        {/* Profile Selector */}
        <div className="flex items-center gap-sm">
          <label htmlFor="stt-profile" className="mono text-small" style={{ minWidth: '50px' }}>Profile:</label>
          <select
            id="stt-profile"
            name="stt-profile"
            className="input select"
            value={activeProfileId}
            onChange={(e) => setActiveProfileId(e.target.value)}
            style={{ width: 'auto', minWidth: '150px', padding: '8px 32px 8px 12px' }}
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <TelemetryStrip telemetry={telemetry} isRecording={isRecording} />
      </div>

      {/* Main Question Panel */}
      <div className="question-panel">
        {/* Question Header */}
        <div className="question-header">
          <div className="question-number">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <button
            className="btn btn-ghost"
            onClick={shuffleQuestions}
            title="Shuffle Questions"
            style={{ padding: '8px', minWidth: 'auto' }}
          >
            <ShuffleIcon />
          </button>
        </div>

        {/* Scenario Prompt */}
        {currentQuestion && (
          <>
            <div className="question-scenario">
              <p className="question-text">{currentQuestion.scenarioPrompt}</p>
            </div>

            {/* Tags */}
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <div className="flex gap-xs" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                {currentQuestion.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--brass-dark)',
                      color: 'var(--surface-paper)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Expected Answer Section - Always visible */}
            <div className="expected-answer">
              <div className="expected-answer-label">Expected Response</div>
              <div className="expected-answer-text" style={{ marginTop: 'var(--space-sm)' }}>
                "{currentQuestion.expectedAnswer.text}"
                {currentQuestion.expectedAnswer.variants && currentQuestion.expectedAnswer.variants.length > 0 && (
                  <div style={{ marginTop: 'var(--space-xs)', opacity: 0.7, fontSize: 'var(--font-size-xs)' }}>
                    Variants: {currentQuestion.expectedAnswer.variants.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Hints */}
            {currentQuestion.hints && currentQuestion.hints.length > 0 && (
              <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'rgba(205, 127, 50, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--brass-primary)', marginBottom: '4px' }}>Hints:</div>
                <ul style={{ paddingLeft: 'var(--space-md)', margin: 0 }}>
                  {currentQuestion.hints.map((hint, idx) => (
                    <li key={idx} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-on-dark)' }}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Buttons - Navigation & TALK */}
      <div className="control-buttons">
        {/* Previous Button */}
        <button
          className="control-btn"
          onClick={previousQuestion}
          disabled={isRecording || isProcessing}
          title="Previous Question"
        >
          <PreviousIcon />
        </button>

        {/* Main TALK Button */}
        {!isRecording ? (
          <button
            className={`talk-btn ${isProcessing ? 'processing' : ''}`}
            onClick={handleStartRecording}
            disabled={!canRecord || isProcessing}
            title={canRecord ? 'Click to start recording' : 'Select a profile to record'}
          >
            {isProcessing ? (
              <>
                <div className="spinner" style={{ width: '24px', height: '24px' }} />
                <span style={{ fontSize: 'var(--font-size-xs)' }}>Wait...</span>
              </>
            ) : (
              <>
                <MicrophoneIcon />
                <span>TALK</span>
              </>
            )}
          </button>
        ) : (
          <button
            className="talk-btn recording"
            onClick={handleStopRecording}
            title="Click to stop recording"
          >
            <StopIcon />
            <span>STOP</span>
          </button>
        )}

        {/* Next Button */}
        <button
          className="control-btn"
          onClick={nextQuestion}
          disabled={isRecording || isProcessing}
          title="Next Question"
        >
          <NextIcon />
        </button>
      </div>

      {/* Status Message */}
      <div className="text-center">
        {!canRecord && status === 'idle' && !activeProfile && (
          <p className="text-small text-muted">
            Select a profile above to enable recording
          </p>
        )}
        {canRecord && !isRecording && status === 'idle' && (
          <p className="text-small text-muted">
            Press the TALK button and speak your response clearly
          </p>
        )}
        {isRecording && (
          <p className="text-small" style={{ color: 'var(--accent-danger)' }}>
            Recording... Press STOP when finished
          </p>
        )}
        {status === 'processing' && (
          <p className="text-small" style={{ color: 'var(--brass-primary)' }}>
            Processing your response...
          </p>
        )}
      </div>

      {/* Error Display */}
      {sessionError && (
        <div
          className="ink-bar"
          style={{
            background: 'linear-gradient(180deg, #A84232 0%, var(--accent-danger) 100%)',
            color: 'var(--surface-paper)',
            textAlign: 'center'
          }}
        >
          {sessionError}
        </div>
      )}

      {/* Transcript Section */}
      <TranscriptDisplay
        interimTranscript={interimTranscript}
        finalTranscript={finalTranscript}
        isRecording={isRecording}
        expectedAnswer={currentQuestion?.expectedAnswer.text}
      />

      {/* Score Section */}
      <ScoreDisplay
        score={scoreResult}
        isLoading={status === 'processing'}
      />

      {/* Quick Stats Footer */}
      {activeProfile && (
        <div className="ink-bar">
          <div className="flex gap-lg justify-center" style={{ flexWrap: 'wrap' }}>
            <span className="mono text-small">
              Pass Mark: <strong style={{ color: 'var(--brass-light)' }}>{activeProfile.benchmarks.passMarkOverall}%</strong>
            </span>
            <span className="mono text-small">
              Weights: <strong style={{ color: 'var(--brass-light)' }}>
                A:{Math.round(activeProfile.weights.accuracy * 100)}%
                F:{Math.round(activeProfile.weights.fluency * 100)}%
                S:{Math.round(activeProfile.weights.structure * 100)}%
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Inline styles for spinner */}
      <style>{`
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: var(--text-on-brass);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .talk-btn.processing {
          background: linear-gradient(145deg, var(--brass-dark) 0%, var(--brass-primary) 50%, var(--brass-dark) 100%);
          cursor: wait;
        }
      `}</style>
    </div>
  );
}

export default STTTest;

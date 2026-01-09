import { useState, useCallback, useRef, useEffect } from 'react';
import type { Question, Profile, ScoreResult, TestRun, RunTelemetry, FluencyMetrics } from '../types';
import { normalizeText } from '../utils/textNormalization';
import { estimateFluencyMetrics } from '../utils/fluencyMetrics';

type SessionStatus = 'idle' | 'connecting' | 'connected' | 'recording' | 'processing' | 'error';

interface UseSTTSessionReturn {
  status: SessionStatus;
  interimTranscript: string;
  finalTranscript: string;
  scoreResult: ScoreResult | null;
  error: string | null;
  startSession: (question: Question, profile: Profile) => Promise<void>;
  stopSession: () => void;
  isRecording: boolean;
  telemetry: Partial<RunTelemetry>;
  preConnect: () => Promise<void>;
}

interface ScoreRequest {
  expectedAnswer: {
    raw: string;
    normalized: string;
  };
  transcript: {
    raw: string;
    normalized: string;
  };
  fluencyMetrics: FluencyMetrics;
  structureRequirements: {
    requireReceiver: boolean;
    requireSender: boolean;
    requireLocation: boolean;
    requireIntent: boolean;
    closingOptional: boolean;
  };
  profileParameters: {
    weights: { accuracy: number; fluency: number; structure: number };
    fluency: {
      fillerPenaltyPerWord: number;
      fillerPenaltyCap: number;
      pausePenalty: number;
      longPausePenalty: number;
      pausePenaltyCap: number;
    };
  };
  scoringPrompt: string;
  explanationPrompt: string;
  model?: string;
  temperature?: number;
}

/**
 * WebSocket-based Speech-to-Text Session Hook
 *
 * Uses OpenAI's Realtime API via WebSocket for pure transcription (no AI responses).
 * This implementation uses the transcription_sessions endpoint for transcription-only mode.
 *
 * Flow:
 * 1. Get ephemeral token from our server (which calls OpenAI's transcription_sessions)
 * 2. Connect via WebSocket to wss://api.openai.com/v1/realtime?intent=transcription
 * 3. Get microphone access and set up audio capture
 * 4. On TALK: Start capturing audio as PCM16 and send via input_audio_buffer.append
 * 5. Handle transcription events (delta, completed)
 * 6. On STOP: Stop audio capture, wait for final transcription, score
 *
 * @see https://platform.openai.com/docs/guides/speech-to-text#streaming-transcriptions
 */
export function useSTTSession(onRunComplete?: (run: TestRun) => void): UseSTTSessionReturn {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<Partial<RunTelemetry>>({});

  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Session state refs
  const questionRef = useRef<Question | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const startTimeRef = useRef<number>(0);
  const connectTimeRef = useRef<number>(0);
  const firstTextTimeRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const sessionReadyRef = useRef<boolean>(false); // Track if OpenAI session is ready

  // Pre-connection state
  const preConnectedRef = useRef<boolean>(false);
  const preConnectedWsRef = useRef<WebSocket | null>(null);
  const preConnectedStreamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    console.log('[WebSocket] Cleaning up resources');
    isRecordingRef.current = false;
    sessionReadyRef.current = false;

    // Close worklet node
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Close source node
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // Stop media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[WebSocket] Stopped track:', track.kind);
      });
      mediaStreamRef.current = null;
    }

    // Clean up pre-connection resources
    if (preConnectedWsRef.current && preConnectedWsRef.current !== wsRef.current) {
      if (preConnectedWsRef.current.readyState === WebSocket.OPEN) {
        preConnectedWsRef.current.close();
      }
      preConnectedWsRef.current = null;
    }
    if (preConnectedStreamRef.current && preConnectedStreamRef.current !== mediaStreamRef.current) {
      preConnectedStreamRef.current.getTracks().forEach(track => track.stop());
      preConnectedStreamRef.current = null;
    }
    preConnectedRef.current = false;
  }, []);

  const scoreTranscript = async (
    transcript: string,
    question: Question,
    profile: Profile,
    audioDurationMs: number
  ): Promise<ScoreResult> => {
    const evalStart = Date.now();

    // Build normalized versions
    const transcriptNormalized = normalizeText(transcript, {
      convertNumbersToDigits: profile.normalization.digitWordEquivalence,
      removeFillers: true
    });

    const expectedNormalized = normalizeText(question.expectedAnswer.text, {
      convertNumbersToDigits: profile.normalization.digitWordEquivalence
    });

    // Estimate fluency metrics
    const fluencyMetrics = estimateFluencyMetrics(transcript, audioDurationMs);

    // Get structure requirements (use defaults if not specified)
    const structureRequirements = question.expectedAnswer.structure || {
      requireReceiver: true,
      requireSender: true,
      requireLocation: false,
      requireIntent: true,
      closingOptional: true
    };

    // Build the request payload
    const requestPayload: ScoreRequest = {
      expectedAnswer: {
        raw: question.expectedAnswer.text,
        normalized: expectedNormalized
      },
      transcript: {
        raw: transcript,
        normalized: transcriptNormalized
      },
      fluencyMetrics,
      structureRequirements,
      profileParameters: {
        weights: profile.weights,
        fluency: {
          fillerPenaltyPerWord: profile.fluency.fillerPenaltyPerWord,
          fillerPenaltyCap: profile.fluency.fillerPenaltyCap,
          pausePenalty: profile.fluency.pausePenalty,
          longPausePenalty: profile.fluency.longPausePenalty,
          pausePenaltyCap: 20 // Default cap
        }
      },
      scoringPrompt: profile.evaluator.scoringPromptTemplate,
      explanationPrompt: profile.evaluator.explanationPromptTemplate,
      model: profile.evaluator.model,
      temperature: profile.evaluator.temperature
    };

    const response = await fetch('/api/evaluator/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to score transcript');
    }

    const result = await response.json();

    setTelemetry(prev => ({
      ...prev,
      evaluatorLatencyMs: Date.now() - evalStart
    }));

    // Determine pass/fail based on profile benchmarks
    const passed = result.overallScore >= profile.benchmarks.passMarkOverall;

    return {
      ...result,
      passed
    };
  };

  /**
   * Create a WebSocket connection to OpenAI's Realtime transcription API
   */
  const createWebSocketSession = async (): Promise<{
    ws: WebSocket;
    stream: MediaStream;
  }> => {
    console.log('[WebSocket] Creating new transcription session');

    // Step 1: Get ephemeral token from our server
    console.log('[WebSocket] Requesting ephemeral token...');
    const tokenResponse = await fetch('/api/webrtc/session', {
      method: 'GET',
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get ephemeral token');
    }

    const tokenData = await tokenResponse.json();
    console.log('[WebSocket] Got ephemeral token:', {
      sessionId: tokenData.sessionId,
      model: tokenData.model,
      expiresAt: tokenData.expiresAt
    });

    if (!tokenData.clientSecret) {
      throw new Error('No client secret in token response');
    }

    // Step 2: Get microphone access
    console.log('[WebSocket] Requesting microphone access');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000 // OpenAI expects 24kHz for PCM16
      }
    });

    const audioTrack = stream.getAudioTracks()[0];
    const audioSettings = audioTrack.getSettings();
    console.log('[WebSocket] Audio track settings:', {
      deviceId: audioSettings.deviceId,
      sampleRate: audioSettings.sampleRate,
      channelCount: audioSettings.channelCount,
      echoCancellation: audioSettings.echoCancellation,
      noiseSuppression: audioSettings.noiseSuppression
    });

    // Step 3: Connect to OpenAI's WebSocket endpoint with ephemeral token
    console.log('[WebSocket] Connecting to OpenAI transcription endpoint...');
    const wsUrl = 'wss://api.openai.com/v1/realtime?intent=transcription';

    // Connect using subprotocols for authentication
    const ws = new WebSocket(wsUrl, [
      'realtime',
      `openai-insecure-api-key.${tokenData.clientSecret}`,
      'openai-beta.realtime-v1'
    ]);

    // Wait for WebSocket to open AND session to be created
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 15000); // Increased timeout to allow for session creation

      let wsOpened = false;

      ws.onopen = () => {
        console.log('[WebSocket] WebSocket connected, waiting for transcription_session.created...');
        wsOpened = true;
      };

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('[WebSocket] Setup event:', event.type);

          if (event.type === 'transcription_session.created') {
            clearTimeout(timeout);
            sessionReadyRef.current = true;
            console.log('[WebSocket] ✅ Session ready! Config:', {
              id: event.session?.id,
              input_audio_format: event.session?.input_audio_format,
              model: event.session?.input_audio_transcription?.model,
              turn_detection: event.session?.turn_detection?.type
            });
            resolve();
          } else if (event.type === 'error') {
            clearTimeout(timeout);
            console.error('[WebSocket] Session error:', event.error);
            reject(new Error(event.error?.message || 'Session creation failed'));
          }
        } catch (err) {
          console.warn('[WebSocket] Failed to parse setup event:', e.data);
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        console.error('[WebSocket] Connection error:', err);
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = (e) => {
        if (!wsOpened) {
          clearTimeout(timeout);
          reject(new Error(`WebSocket closed before opening: ${e.code} ${e.reason}`));
        }
      };
    });

    return { ws, stream };
  };

  /**
   * Set up AudioWorklet for capturing PCM16 audio and sending to WebSocket
   *
   * IMPORTANT: OpenAI expects PCM16 at 24kHz sample rate.
   * Browsers often capture at 48kHz, so we need to handle resampling.
   */
  const setupAudioCapture = async (ws: WebSocket, stream: MediaStream) => {
    console.log('[WebSocket] Setting up audio capture');

    // Get the actual sample rate from the track
    const audioTrack = stream.getAudioTracks()[0];
    const trackSettings = audioTrack.getSettings();
    const inputSampleRate = trackSettings.sampleRate || 48000;

    console.log('[WebSocket] Audio track input sample rate:', inputSampleRate);

    // Create audio context - use native sample rate first, we'll resample
    // Note: Some browsers don't support AudioContext with custom sample rate
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const actualSampleRate = audioContext.sampleRate;
    console.log('[WebSocket] AudioContext sample rate:', actualSampleRate);

    // Calculate resampling ratio
    const TARGET_SAMPLE_RATE = 24000;
    const resampleRatio = TARGET_SAMPLE_RATE / actualSampleRate;
    console.log('[WebSocket] Resample ratio:', resampleRatio, `(${actualSampleRate}Hz -> ${TARGET_SAMPLE_RATE}Hz)`);

    // Create source node from media stream
    const sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNodeRef.current = sourceNode;

    // Use ScriptProcessorNode for audio processing
    const bufferSize = 4096;
    const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);

    let audioChunkCount = 0;

    scriptProcessor.onaudioprocess = (e) => {
      if (!isRecordingRef.current || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      // CRITICAL: Only send audio after session is confirmed ready
      if (!sessionReadyRef.current) {
        console.log('[WebSocket] Skipping audio - session not ready yet');
        return;
      }

      const inputData = e.inputBuffer.getChannelData(0);

      // Calculate audio level for debugging (RMS)
      let sumSquares = 0;
      let maxSample = 0;
      for (let i = 0; i < inputData.length; i++) {
        sumSquares += inputData[i] * inputData[i];
        maxSample = Math.max(maxSample, Math.abs(inputData[i]));
      }
      const rms = Math.sqrt(sumSquares / inputData.length);

      audioChunkCount++;

      // Log audio level diagnostics
      if (audioChunkCount <= 5 || audioChunkCount % 20 === 0) {
        console.log(`[WebSocket] Chunk #${audioChunkCount}: RMS=${rms.toFixed(6)}, max=${maxSample.toFixed(6)}, samples=${inputData.length}`);
      }

      // Don't skip silent chunks - OpenAI needs continuous audio for VAD
      // Just log if very quiet
      if (maxSample < 0.0001 && audioChunkCount <= 3) {
        console.log(`[WebSocket] Chunk #${audioChunkCount} is very quiet (max=${maxSample.toFixed(8)})`);
      }

      // Resample from audioContext sample rate to 24kHz
      // Simple linear interpolation resampling
      const targetLength = Math.round(inputData.length * resampleRatio);
      const resampled = new Float32Array(targetLength);

      for (let i = 0; i < targetLength; i++) {
        const srcIdx = i / resampleRatio;
        const srcIdxFloor = Math.floor(srcIdx);
        const srcIdxCeil = Math.min(srcIdxFloor + 1, inputData.length - 1);
        const t = srcIdx - srcIdxFloor;

        // Linear interpolation
        resampled[i] = inputData[srcIdxFloor] * (1 - t) + inputData[srcIdxCeil] * t;
      }

      // Convert Float32 (-1 to 1) to Int16 PCM with explicit little-endian encoding
      // OpenAI requires: 16-bit PCM, 24kHz, mono, little-endian
      const pcm16Bytes = new Uint8Array(resampled.length * 2);
      const dataView = new DataView(pcm16Bytes.buffer);

      for (let i = 0; i < resampled.length; i++) {
        // Clamp to [-1, 1] and scale to Int16 range
        const s = Math.max(-1, Math.min(1, resampled[i]));
        const sample = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7FFF);
        // Write as little-endian explicitly
        dataView.setInt16(i * 2, sample, true); // true = little-endian
      }

      // Convert to base64 using a more robust method
      // Build binary string in chunks to avoid stack overflow
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < pcm16Bytes.length; i += chunkSize) {
        const chunk = pcm16Bytes.subarray(i, Math.min(i + chunkSize, pcm16Bytes.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64Audio = btoa(binaryString);

      // Log first chunk details for debugging
      if (audioChunkCount === 1) {
        // Find first non-zero byte for debugging
        let firstNonZeroIdx = -1;
        let nonZeroCount = 0;
        for (let i = 0; i < pcm16Bytes.length; i += 2) {
          const sample = dataView.getInt16(i, true);
          if (sample !== 0) {
            if (firstNonZeroIdx === -1) firstNonZeroIdx = i / 2;
            nonZeroCount++;
          }
        }

        // Calculate audio duration of this chunk
        const numSamples = pcm16Bytes.length / 2;
        const durationMs = (numSamples / TARGET_SAMPLE_RATE) * 1000;

        // Get min/max samples for verification
        let sampleMin = 0, sampleMax = 0;
        for (let i = 0; i < pcm16Bytes.length; i += 2) {
          const sample = dataView.getInt16(i, true);
          sampleMin = Math.min(sampleMin, sample);
          sampleMax = Math.max(sampleMax, sample);
        }

        // Verify base64 by decoding and checking
        const testDecode = atob(base64Audio);
        const decodedLength = testDecode.length;
        const firstDecodedBytes = Array.from(testDecode.slice(0, 10)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');

        console.log(`[WebSocket] First audio chunk details:`, {
          inputSamples: inputData.length,
          resampledSamples: resampled.length,
          pcm16ByteLength: pcm16Bytes.length,
          numSamples,
          base64Length: base64Audio.length,
          durationMs: durationMs.toFixed(2),
          firstBytes: Array.from(pcm16Bytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '),
          firstNonZeroSampleIdx: firstNonZeroIdx,
          nonZeroSampleCount: nonZeroCount,
          sampleMin,
          sampleMax,
          wsReadyState: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
          // Verify base64 round-trip
          decodedLength,
          firstDecodedBytes,
          bytesMatch: decodedLength === pcm16Bytes.length,
          // Show actual base64 prefix
          base64Prefix: base64Audio.substring(0, 50)
        });

        // Log WebSocket buffer status
        console.log(`[WebSocket] Buffer before send: ${ws.bufferedAmount} bytes`);
      }

      // Send to OpenAI
      const payload = JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      });

      try {
        const bufferBefore = ws.bufferedAmount;
        ws.send(payload);
        const bufferAfter = ws.bufferedAmount;

        // Log periodically to verify data is going out
        if (audioChunkCount <= 5 || audioChunkCount % 30 === 0) {
          const numSamples = pcm16Bytes.length / 2;
          const durationMs = (numSamples / TARGET_SAMPLE_RATE) * 1000;
          console.log(`[WebSocket] Sent chunk #${audioChunkCount}: ${payload.length} bytes, ${durationMs.toFixed(1)}ms of audio, buffer: ${bufferBefore}->${bufferAfter}`);
        }

        // Log the actual payload structure for first chunk
        if (audioChunkCount === 1) {
          const parsedPayload = JSON.parse(payload);
          console.log('[WebSocket] First payload structure:', {
            type: parsedPayload.type,
            audioFieldType: typeof parsedPayload.audio,
            audioLength: parsedPayload.audio?.length,
            payloadLength: payload.length
          });
        }
      } catch (err) {
        console.error(`[WebSocket] Failed to send chunk #${audioChunkCount}:`, err);
      }
    };

    // Connect: source -> scriptProcessor -> destination (required for processing)
    sourceNode.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    // Store for cleanup (using workletNode ref for the script processor)
    workletNodeRef.current = scriptProcessor as unknown as AudioWorkletNode;

    console.log('[WebSocket] Audio capture setup complete:', {
      inputSampleRate: actualSampleRate,
      outputSampleRate: TARGET_SAMPLE_RATE,
      resampleRatio,
      bufferSize
    });
  };

  /**
   * Pre-connect: establish WebSocket connection in advance for instant recording start
   */
  const preConnect = useCallback(async () => {
    if (preConnectedRef.current) {
      console.log('[WebSocket] Pre-connection already established');
      return;
    }

    // Clean up any existing pre-connection
    if (preConnectedWsRef.current) {
      if (preConnectedWsRef.current.readyState === WebSocket.OPEN) {
        preConnectedWsRef.current.close();
      }
      preConnectedWsRef.current = null;
    }

    try {
      console.log('[WebSocket] Pre-connecting...');
      const { ws, stream } = await createWebSocketSession();

      preConnectedWsRef.current = ws;
      preConnectedStreamRef.current = stream;

      // Set up basic event handlers for pre-connection
      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('[WebSocket] Pre-connection event:', event.type);

          // Track session readiness for pre-connection too
          if (event.type === 'transcription_session.created') {
            sessionReadyRef.current = true;
            console.log('[WebSocket] Pre-connection session ready:', {
              id: event.session?.id,
              input_audio_format: event.session?.input_audio_format
            });
          }
        } catch (err) {
          console.warn('[WebSocket] Failed to parse pre-connection event:', e.data);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Pre-connection error:', err);
        preConnectedRef.current = false;
      };

      ws.onclose = () => {
        console.log('[WebSocket] Pre-connection closed');
        preConnectedRef.current = false;
      };

      preConnectedRef.current = true;
      console.log('[WebSocket] Pre-connection ready');

    } catch (err) {
      console.warn('[WebSocket] Pre-connection failed:', err);
      preConnectedRef.current = false;
    }
  }, []);

  /**
   * Start a recording session
   */
  const startSession = useCallback(async (question: Question, profile: Profile) => {
    try {
      setError(null);
      setInterimTranscript('');
      setFinalTranscript('');
      setScoreResult(null);
      setTelemetry({});

      questionRef.current = question;
      profileRef.current = profile;
      startTimeRef.current = Date.now();

      // Check if we have a pre-connected session ready
      const usePreConnected = preConnectedRef.current &&
        preConnectedWsRef.current?.readyState === WebSocket.OPEN;

      let ws: WebSocket;
      let stream: MediaStream;

      if (usePreConnected) {
        // FAST PATH: Use pre-connected session
        console.log('[WebSocket] Using pre-connected session for instant start');
        ws = preConnectedWsRef.current!;
        stream = preConnectedStreamRef.current!;

        // Transfer to active refs
        wsRef.current = ws;
        mediaStreamRef.current = stream;

        // Clear pre-connection refs
        preConnectedWsRef.current = null;
        preConnectedStreamRef.current = null;
        preConnectedRef.current = false;

        connectTimeRef.current = Date.now() - startTimeRef.current;
        setTelemetry(prev => ({ ...prev, connectTimeMs: connectTimeRef.current }));
        setStatus('connected');

      } else {
        // SLOW PATH: Need to establish new connection
        console.log('[WebSocket] No pre-connection available, establishing new session');
        cleanup();
        setStatus('connecting');

        try {
          const session = await createWebSocketSession();
          ws = session.ws;
          stream = session.stream;

          wsRef.current = ws;
          mediaStreamRef.current = stream;

          connectTimeRef.current = Date.now() - startTimeRef.current;
          setTelemetry(prev => ({ ...prev, connectTimeMs: connectTimeRef.current }));

        } catch (connErr) {
          console.error('[WebSocket] Connection failed:', connErr);
          setError(connErr instanceof Error ? connErr.message : 'Failed to connect');
          setStatus('error');
          return;
        }
      }

      // Set up WebSocket message handler
      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);

          // Log events (except frequent audio buffer appends)
          if (event.type !== 'input_audio_buffer.append') {
            console.log('[WebSocket] Event:', event.type, event);
          }

          switch (event.type) {
            // Session events
            case 'transcription_session.created':
              console.log('[WebSocket] ✅ Transcription session created:', event.session);
              break;

            case 'transcription_session.updated':
              console.log('[WebSocket] Session updated:', event.session);
              break;

            // Input audio buffer events - VAD working
            case 'input_audio_buffer.committed':
              console.log('[WebSocket] ✅ Audio buffer committed - item_id:', event.item_id);
              break;

            case 'input_audio_buffer.speech_started':
              console.log('[WebSocket] 🎤 Speech detected!');
              break;

            case 'input_audio_buffer.speech_stopped':
              console.log('[WebSocket] 🔇 Speech stopped - VAD will commit buffer');
              break;

            case 'input_audio_buffer.cleared':
              console.log('[WebSocket] Audio buffer cleared');
              break;

            // Conversation item events
            case 'conversation.item.created':
              console.log('[WebSocket] Conversation item created:', event.item?.id);
              break;

            // Transcription events
            case 'conversation.item.input_audio_transcription.delta':
              // Interim transcription delta
              if (firstTextTimeRef.current === 0) {
                firstTextTimeRef.current = Date.now() - startTimeRef.current;
                setTelemetry(prev => ({ ...prev, timeToFirstTextMs: firstTextTimeRef.current }));
              }
              if (event.delta) {
                setInterimTranscript(prev => prev + event.delta);
              }
              break;

            case 'conversation.item.input_audio_transcription.completed':
              // Final transcription for this turn
              console.log('[WebSocket] ✅ Transcription completed:', event.transcript);
              if (event.transcript) {
                setFinalTranscript(prev => {
                  const separator = prev && event.transcript ? ' ' : '';
                  return prev + separator + event.transcript;
                });
                setInterimTranscript('');

                const timeToFinal = Date.now() - startTimeRef.current;
                setTelemetry(prev => ({ ...prev, timeToFinalMs: timeToFinal }));
              }
              break;

            case 'error':
              console.error('[WebSocket] Error event:', event.error);
              // Don't treat "buffer too small" as a fatal error - this happens when
              // we manually commit but VAD has already committed (buffer is empty)
              const errorCode = event.error?.code;
              const errorMsg = event.error?.message || 'Unknown error';
              if (errorCode === 'input_audio_buffer_commit_empty') {
                console.log('[WebSocket] Ignoring empty buffer commit error (VAD already committed)');
              } else {
                setError(errorMsg);
                setStatus('error');
              }
              break;

            default:
              if (event.type) {
                console.log('[WebSocket] Unhandled event type:', event.type);
              }
          }
        } catch (parseErr) {
          console.warn('[WebSocket] Failed to parse event:', e.data);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        setError('WebSocket error');
        setStatus('error');
      };

      ws.onclose = (e) => {
        console.log('[WebSocket] Closed:', e.code, e.reason);
        if (status === 'recording') {
          setStatus('idle');
        }
      };

      // Set up audio capture
      await setupAudioCapture(ws, stream);

      // Start recording
      recordingStartTimeRef.current = Date.now();
      isRecordingRef.current = true;
      setStatus('recording');

      console.log('[WebSocket] 🎤 Recording started');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setStatus('error');
      cleanup();
    }
  }, [cleanup, status]);

  /**
   * Stop the recording session and get scoring
   */
  const stopSession = useCallback(async () => {
    if (!wsRef.current || !questionRef.current || !profileRef.current) {
      cleanup();
      setStatus('idle');
      return;
    }

    // Stop recording immediately
    isRecordingRef.current = false;
    console.log('[WebSocket] 🔇 Recording stopped');

    setStatus('processing');

    // Calculate audio duration
    const audioDurationMs = Date.now() - recordingStartTimeRef.current;
    console.log('[WebSocket] Stopping session:', { audioDurationMs });

    // Note: With server VAD enabled, the audio buffer is automatically committed
    // when speech stops. We don't need to manually commit here.
    // If we do commit and the buffer is empty (already committed by VAD),
    // we'll get an error which we can safely ignore.
    if (wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.commit'
        }));
        console.log('[WebSocket] Sent input_audio_buffer.commit (may already be committed by VAD)');
      } catch (err) {
        console.log('[WebSocket] Could not send commit (connection may be closing)');
      }
    }

    // Wait for final transcription to complete
    console.log('[WebSocket] Waiting for transcription to finalize...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    cleanup();

    // Score the transcript
    const transcript = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
    if (transcript) {
      try {
        const result = await scoreTranscript(
          transcript,
          questionRef.current,
          profileRef.current,
          audioDurationMs
        );

        setScoreResult(result);

        const totalLatency = Date.now() - startTimeRef.current;

        const runTelemetry: RunTelemetry = {
          connectTimeMs: telemetry.connectTimeMs || 0,
          timeToFirstTextMs: telemetry.timeToFirstTextMs || 0,
          timeToFinalMs: telemetry.timeToFinalMs || 0,
          totalLatencyMs: totalLatency,
          evaluatorLatencyMs: telemetry.evaluatorLatencyMs || 0,
          audioDurationMs,
          estimatedCost: calculateCost(audioDurationMs)
        };

        setTelemetry(runTelemetry);

        // Create and emit run record
        if (onRunComplete) {
          const transcriptNormalized = normalizeText(transcript, {
            convertNumbersToDigits: profileRef.current.normalization.digitWordEquivalence,
            removeFillers: true
          });

          const expectedNormalized = normalizeText(questionRef.current.expectedAnswer.text, {
            convertNumbersToDigits: profileRef.current.normalization.digitWordEquivalence
          });

          const run: TestRun = {
            id: `run-${Date.now()}`,
            questionId: questionRef.current.id,
            timestamp: new Date().toISOString(),
            transcript: {
              raw: transcript,
              normalized: transcriptNormalized
            },
            expectedAnswer: {
              raw: questionRef.current.expectedAnswer.text,
              normalized: expectedNormalized
            },
            fluencyMetrics: estimateFluencyMetrics(transcript, audioDurationMs),
            score: result,
            telemetry: runTelemetry,
            profileId: profileRef.current.id,
            status: 'success'
          };
          onRunComplete(run);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to score transcript');
      }
    }

    setStatus('idle');

    // Pre-connect for the next recording (in background)
    setTimeout(() => {
      console.log('[WebSocket] Pre-connecting for next recording...');
      preConnect();
    }, 100);
  }, [finalTranscript, interimTranscript, telemetry, onRunComplete, cleanup, preConnect]);

  return {
    status,
    interimTranscript,
    finalTranscript,
    scoreResult,
    error,
    startSession,
    stopSession,
    isRecording: status === 'recording',
    telemetry,
    preConnect
  };
}

function calculateCost(audioDurationMs: number): number {
  // OpenAI Realtime transcription pricing: approximately $0.006 per minute
  const minutes = audioDurationMs / 60000;
  const transcriptionCost = minutes * 0.006;

  // Evaluator call: ~$0.001 per evaluation (rough estimate for gpt-4o-mini)
  const evaluatorCost = 0.001;

  return transcriptionCost + evaluatorCost;
}

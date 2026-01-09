# Debug Log

Issues encountered and resolved during development.

---

## Format

```
### [ISSUE-XXX] Brief Title
**Date:** YYYY-MM-DD
**Severity:** Critical | High | Medium | Low
**Status:** Open | Resolved | Workaround

**Symptoms:**
- What was observed

**Root Cause:**
- Why it happened

**Solution:**
- How it was fixed

**Prevention:**
- How to avoid in future
```

---

## Active Issues

_No active issues_

---

## Resolved Issues

### [ISSUE-001] Initial Setup - Clean
**Date:** 2026-01-08
**Severity:** Low
**Status:** Resolved

**Symptoms:**
- N/A - Clean setup

**Root Cause:**
- N/A

**Solution:**
- Project initialized successfully with npm workspaces

**Prevention:**
- Follow established monorepo patterns

---

### [ISSUE-002] useProfile Interface Mismatch
**Date:** 2026-01-08
**Severity:** Medium
**Status:** Resolved

**Symptoms:**
- TypeScript errors in Parameters.tsx and Prompts.tsx
- Properties `saveProfile`, `resetToDefault` did not exist
- `updateProfile` and `exportProfile` signatures changed

**Root Cause:**
- useProfile hook was updated with new interface but consuming components were not updated

**Solution:**
- Updated Parameters.tsx to use new `updateProfile(id, profile)` signature
- Updated Prompts.tsx to use `Profile['evaluator']` type instead of `typeof activeProfile.evaluator`
- Added wrapper `handleUpdateProfile` functions in both components
- Changed `resetToDefault` to `resetToDefaults`

**Prevention:**
- When updating hook interfaces, search for all usages and update simultaneously
- Use TypeScript strict mode to catch interface mismatches early

---

### [ISSUE-003] Port Already In Use
**Date:** 2026-01-08
**Severity:** Low
**Status:** Resolved

**Symptoms:**
- Server failed to start with `EADDRINUSE: address already in use :::3001`

**Root Cause:**
- Previous server instance was still running

**Solution:**
- Killed existing processes on ports 3001, 5173, 5174

**Prevention:**
- Add proper cleanup scripts
- Consider implementing graceful shutdown

---

### [ISSUE-004] Ephemeral Token 404 - Mismatched API Path
**Date:** 2026-01-08
**Severity:** High
**Status:** Resolved

**Symptoms:**
- Clicking TALK button showed "Failed to mint ephemeral token" error
- Browser console displayed: `POST /api/openai/transcription-session 404 (Not Found)`
- User could not start speech recognition

**Root Cause:**
- Client-server route path mismatch
- Server registered route at: `/api/openai/realtime/transcription-session`
- Client was calling: `/api/openai/transcription-session`
- Missing `/realtime` segment in client fetch URL

**Files Affected:**
- `apps/server/src/index.ts` (line 29) - Server route definition
- `apps/web/src/hooks/useSTTSession.ts` (line 99) - Client fetch call

**Solution:**
- Updated client fetch URL in `useSTTSession.ts`:
  ```typescript
  // Before:
  fetch('/api/openai/transcription-session', ...)

  // After:
  fetch('/api/openai/realtime/transcription-session', ...)
  ```

**Prevention:**
- Use centralized API route constants (e.g., `API_ROUTES.TRANSCRIPTION_SESSION`)
- Add route documentation/comments when registering server endpoints
- Consider OpenAPI/Swagger spec for API documentation

---

### [ISSUE-005] OpenAI Realtime Transcription Session - Multiple Integration Errors
**Date:** 2026-01-08
**Severity:** High
**Status:** Resolved

**Symptoms:**
- "Incorrect API key provided: undefined" error when clicking TALK
- 401 Unauthorized on `/api/openai/realtime/transcription-session`
- "You must not provide a model parameter for transcription sessions" error
- "Passing a realtime session update event to a transcription session is not allowed" error
- Recording would not start properly

**Root Cause:**
Multiple issues with OpenAI Realtime Transcription API integration:

1. **Data Structure Mismatch**: Server extracts `client_secret.value` before returning, but client tried to access `.value` again on the already-extracted string
2. **WebSocket Model Parameter**: Transcription sessions must NOT include `?model=` in WebSocket URL (model is set server-side)
3. **Session Update Not Allowed**: Cannot send `session.update` events to transcription sessions (pre-configured server-side)
4. **Server Restart Required**: `.env` changes require server restart to take effect

**Files Affected:**
- `apps/web/src/hooks/useSTTSession.ts` (lines 109, 220, 233-240)

**Solution:**
```typescript
// Fix 1: Client secret is already extracted by server
// Before: return data.client_secret.value;
// After:
return data.client_secret;

// Fix 2: Remove model parameter from WebSocket URL
// Before: 'wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview'
// After:
const wsUrl = 'wss://api.openai.com/v1/realtime';

// Fix 3: Remove session.update call (not allowed for transcription sessions)
// Removed entire ws.send({ type: 'session.update', ... }) block
```

**Prevention:**
- Document OpenAI Realtime API differences between conversation and transcription modes
- Add comments explaining transcription session constraints
- Test API integration with actual OpenAI endpoints during development
- Ensure server restarts after `.env` changes during development

---

### [ISSUE-006] Audio Buffer Empty (0ms) on Commit
**Date:** 2026-01-08
**Severity:** High
**Status:** Resolved

**Symptoms:**
- "Error committing input audio buffer: buffer too small. Expected at least 100ms of audio, but buffer only has 0.00ms of audio"
- Transcription not working despite recording starting

**Root Cause:**
Multiple issues with audio capture and WebSocket communication:
1. No tracking of audio chunks sent - couldn't detect if audio was actually captured
2. Immediate commit without ensuring audio was sent
3. Missing handling for various transcription event types

**Files Affected:**
- `apps/web/src/hooks/useSTTSession.ts`

**Solution:**
1. Added `audioChunksSentRef` to track audio chunks sent
2. Added check before commit to ensure audio was captured
3. Added 200ms delay before commit to ensure last chunks are sent
4. Extended wait time for transcription (2000ms)
5. Added comprehensive event logging for debugging
6. Added handling for multiple transcription event type formats

**Prevention:**
- Always track data sent before committing to remote services
- Add debugging logs during development
- Test with actual audio input

---

### [ISSUE-007] Form Fields Missing Accessibility Attributes
**Date:** 2026-01-08
**Severity:** Medium
**Status:** Resolved

**Symptoms:**
- Browser console showing 55 accessibility issues
- Form inputs without id/name attributes
- Labels without htmlFor associations

**Root Cause:**
- Initial development focused on functionality, not accessibility compliance
- Form fields created without proper ARIA attributes

**Files Affected:**
- `apps/web/src/pages/Parameters.tsx`
- `apps/web/src/pages/STTTest.tsx`
- `apps/web/src/pages/Prompts.tsx`

**Solution:**
Added id, name, htmlFor, and aria-label attributes to all form elements:
- Profile selectors
- All input fields (sliders, numbers, text, checkboxes)
- Textareas with aria-label for complex labels

**Prevention:**
- Use accessibility linting (eslint-plugin-jsx-a11y)
- Include accessibility review in PR checklist
- Test with screen readers during development

---

## Known Limitations

1. **MVP Scope**: No audio storage - transcript only
2. **MVP Scope**: localStorage only - no database
3. **MVP Scope**: English-only STT
4. **MVP Scope**: Single user - no auth
5. **Pause Detection**: Estimated from transcript length/duration ratio (no actual audio analysis)
6. **Cost Estimation**: Based on Whisper pricing, actual costs may vary

---

## Troubleshooting Guide

### Common Issues

#### 1. `npm install` fails
```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 2. Vite proxy not working
- Ensure server is running on port 3001
- Check `vite.config.ts` proxy configuration
- Verify CORS settings in server

#### 3. OpenAI API errors
- Verify `.env` has valid `OPENAI_API_KEY`
- Check API key permissions for Realtime API
- Ensure ephemeral token not expired (5 min TTL)
- Check rate limits

#### 4. Microphone not working
- Check browser permissions
- Verify HTTPS or localhost (required for getUserMedia)
- Test with browser's built-in audio test
- Check AudioContext state (may need user interaction first)

#### 5. Build failures
```bash
# Check TypeScript errors
npm run build 2>&1 | grep error

# Common fixes:
# - Import type assertions: import type { X } from '...'
# - Null checks before property access
# - Ensure all dependencies installed
```

#### 6. Profile changes not persisting
- Check browser localStorage (DevTools > Application > Local Storage)
- Verify keys: `stt-console-profiles`, `stt-console-active-profile`
- Clear and reload if corrupted

#### 7. Scoring returns unexpected results
- Check Prompts page for valid scoring prompt
- Verify model is set correctly
- Check temperature setting (lower = more consistent)
- Review console for API errors

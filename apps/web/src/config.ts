// API configuration
// In development, Vite proxy handles /api/* -> localhost:3001
// In production, set VITE_API_URL to the deployed server URL

export const API_URL = import.meta.env.VITE_API_URL || '';

// Helper to build API endpoints
export const api = {
  health: `${API_URL}/api/health`,
  webrtcSession: `${API_URL}/api/webrtc/session`,
  evaluatorScore: `${API_URL}/api/evaluator/score`,
};

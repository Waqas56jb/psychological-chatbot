/**
 * Production: set VITE_API_URL in Vercel to your deployed API base (no trailing slash).
 * Example: https://checkmythoughts-api.onrender.com
 * Local: leave unset — Vite proxies /api to the server on port 3000.
 */
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function analyzeUrl() {
  if (base) return `${base}/api/analyze`;
  return '/api/analyze';
}

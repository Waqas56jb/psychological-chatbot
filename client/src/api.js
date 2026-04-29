const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const analyzeUrl = () => base ? `${base}/api/analyze` : '/api/analyze';
export const chatUrl    = () => base ? `${base}/api/chat`    : '/api/chat';

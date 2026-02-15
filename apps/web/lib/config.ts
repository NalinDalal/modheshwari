// Provide a safe client-side fallback so components don't request `/undefined/...` when env is missing.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
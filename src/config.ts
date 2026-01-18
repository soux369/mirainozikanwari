import { SECURE_GEMINI_API_KEY } from './secrets';

// Directly load from secrets file (bypassing all env/expo-config layers)
export const GEMINI_API_KEY = SECURE_GEMINI_API_KEY || '';

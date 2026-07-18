const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001";
const rawAiUrl = process.env.NEXT_PUBLIC_AI_API_BASE_URL || "http://localhost:8000";

const cleanBaseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const cleanAiUrl = rawAiUrl.endsWith("/") ? rawAiUrl.slice(0, -1) : rawAiUrl;

export const API_BASE_URL = cleanBaseUrl;
export const API_URL = `${cleanBaseUrl}/api`;
export const AI_API_BASE_URL = cleanAiUrl;
export const AI_API_URL = `${cleanAiUrl}/api`;

console.log("✅ API_URL successfully loaded:", API_URL);


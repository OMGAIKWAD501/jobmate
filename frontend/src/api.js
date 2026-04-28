import axios from "axios";

const FALLBACK_API_URL = "https://jobmate-backend-jkx3.onrender.com/api";
const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const isBrowser = typeof window !== "undefined";
const isLocalhostHost =
  isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const shouldIgnoreEnvLocalhostUrl =
  import.meta.env.PROD &&
  !isLocalhostHost &&
  /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(envApiUrl || "");

const normalizeApiBaseUrl = (value) => {
  const sanitized = (value || "").trim().replace(/\/+$/, "");
  if (!sanitized) {
    return FALLBACK_API_URL;
  }
  return sanitized.endsWith("/api") ? sanitized : `${sanitized}/api`;
};

const baseURL = shouldIgnoreEnvLocalhostUrl
  ? FALLBACK_API_URL
  : normalizeApiBaseUrl(envApiUrl || FALLBACK_API_URL);

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
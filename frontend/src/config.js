const FALLBACK_API_URL = "https://jobmate-backend-jkx3.onrender.com/api";
const FALLBACK_SOCKET_URL = "https://jobmate-backend-jkx3.onrender.com";

const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const envSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
const isBrowser = typeof window !== "undefined";
const isLocalhostHost =
  isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const isLocalhostTarget = (value = "") =>
  /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(value);

const API_URL =
  import.meta.env.PROD && !isLocalhostHost && isLocalhostTarget(envApiUrl || "")
    ? FALLBACK_API_URL
    : (envApiUrl || FALLBACK_API_URL);

const SOCKET_URL =
  import.meta.env.PROD && !isLocalhostHost && isLocalhostTarget(envSocketUrl || "")
    ? FALLBACK_SOCKET_URL
    : (envSocketUrl || FALLBACK_SOCKET_URL);

if (!import.meta.env.VITE_API_URL) {
  console.warn("⚠️ VITE_API_URL not set. Using fallback:", API_URL);
}

console.log("✅ API URL:", API_URL);

export { API_URL, SOCKET_URL };
export default API_URL;
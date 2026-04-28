const API_URL = import.meta.env.VITE_API_URL?.trim() || '';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim() || API_URL;

if (!API_URL) {
  console.warn('VITE_API_URL is not set. Set VITE_API_URL in your frontend environment.');
}
console.log('API:', API_URL);

export { API_URL, SOCKET_URL };
export default API_URL;

// In development, these fall back to localhost.
// Set VITE_API_URL and VITE_SOCKET_URL in .env for production builds.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/// <reference types="vite/client" />
/**
 * Centralized API configuration.
 * For production (mobile build), you can override the base URL by creating a .env file 
 * and setting VITE_API_URL=http://your-server-ip:3001
 */

const getApiBaseUrl = () => {
  // Use environment variable if provided (e.g., VITE_API_URL=http://192.168.1.5:3001)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  // In development (Vite), return /api to use the proxy
  // In production (no proxy), this might still work if served together, 
  // but for mobile, we usually need an absolute URL.
  return 'https://paddynexus.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const api = {
  get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`),
  post: (endpoint: string, body: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  put: (endpoint: string, body: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  patch: (endpoint: string, body: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),
  delete: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE'
  }),
};

export const fetchApi = async (endpoint, options = {}) => {
  // Inject token from localStorage for authentication
  const token = localStorage.getItem('token');
  const enrichedOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  // 1. If inside Electron, use the Local P2P IPC Bridge
  if (window.electronAPI && window.electronAPI.invokeApi) {
    try {
      const result = await window.electronAPI.invokeApi(endpoint, enrichedOptions);
      if (result && result.error) {
         throw new Error(result.message || result.error);
      }
      return result;
    } catch (error) {
      console.error(`[IPC API Error] ${endpoint}:`, error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        window.dispatchEvent(new Event('auth_error'));
      }
      throw error;
    }
  }

  // 2. Fallback to standard web backend for browsers, tests, and CI/CD
  console.warn(`[Web Fallback] Electron IPC not found. Routing ${endpoint} to standard web backend.`);
  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, enrichedOptions);
    
    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      // Not JSON response
    }

    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new Event('auth_error'));
      }
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[Web API Error] ${endpoint}:`, error);
    throw error;
  }
};

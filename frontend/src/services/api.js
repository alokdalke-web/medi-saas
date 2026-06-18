export const fetchApi = async (endpoint, options = {}) => {
  // The app is now fully Offline-First P2P. 
  // All API calls must go through the Electron IPC Bridge to the LocalApi.
  if (!window.electronAPI || !window.electronAPI.invokeApi) {
    console.error('Electron IPC bridge not found! The app must be run within the Electron desktop environment.');
    throw new Error('Electron environment required for P2P operations.');
  }

  try {
    // Inject token from localStorage for local offline authentication
    const token = localStorage.getItem('token');
    const enrichedOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    return await window.electronAPI.invokeApi(endpoint, enrichedOptions);
  } catch (error) {
    console.error(`[IPC API Error] ${endpoint}:`, error);
    
    // Simulate 401 dispatch for frontend auth handling if LocalApi throws an auth error
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      window.dispatchEvent(new Event('auth_error'));
    }
    
    throw error;
  }
};

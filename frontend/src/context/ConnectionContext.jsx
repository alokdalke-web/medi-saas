import { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const ConnectionContext = createContext();

export function ConnectionProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeEndpoint, setActiveEndpoint] = useState('local');
  const [syncTimestamp, setSyncTimestamp] = useState(Date.now());
  const checkPending = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const res = await fetchApi('/sync/pending');
      if (res.success) setPendingCount(res.data.count);
    } catch (err) {
      console.error('Failed to check pending count', err);
    }
  };

  const pullDownstreamData = async () => {
    if (!navigator.onLine || !localStorage.getItem('token')) return;
    try {
      const res = await fetchApi('/sync/downstream', { method: 'POST' });
      console.log('Downstream pull complete:', res.message);
      // Optional: force a UI refresh if needed, usually React Query or state handles it on mount
    } catch (err) {
      console.error('Downstream pull failed:', err);
    }
  };

  const flushSyncQueue = async () => {
    if (!navigator.onLine || !localStorage.getItem('token')) return;
    setIsSyncing(true);
    try {
      const res = await fetchApi('/sync/flush', { method: 'POST' });
      console.log('Upstream sync complete:', res.message);
      await pullDownstreamData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
      checkPending();
    }
  };

  // Phase 6: Listen for real-time P2P sync updates from the Electron main process
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onSyncUpdate) {
      window.electronAPI.onSyncUpdate((payload) => {
        console.log('[React] Received real-time P2P sync update:', payload);
        setSyncTimestamp(Date.now());
        
        // Broadcast a standard DOM event so any mounted React component can re-fetch its data
        window.dispatchEvent(new CustomEvent('p2p-sync-update', { detail: payload }));
      });
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkPending();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ isOnline, isSyncing, pendingCount, flushSyncQueue, activeEndpoint, syncTimestamp }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}

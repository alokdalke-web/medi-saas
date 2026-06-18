import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { ComputerDesktopIcon, ServerStackIcon, WifiIcon, SignalIcon } from '@heroicons/react/24/outline';

export default function NetworkNodes() {
  const [nodes, setNodes] = useState([]);
  const [cloudUrl, setCloudUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/network/nodes');
      // Sort nodes by lastSeen descending
      const sortedNodes = (res.data?.nodes || []).sort((a, b) => b.lastSeen - a.lastSeen);
      setNodes(sortedNodes);

      const urlRes = await fetchApi('/network/cloud-url');
      if (urlRes.data?.cloudUrl) {
        setCloudUrl(urlRes.data.cloudUrl);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch network nodes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCloudUrl = async () => {
    try {
      setSavingUrl(true);
      await fetchApi('/network/cloud-url', {
        method: 'POST',
        body: JSON.stringify({ cloudUrl })
      });
      alert('Cloud Sync URL saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save Cloud URL');
    } finally {
      setSavingUrl(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    
    // Poll every 5 seconds since DiscoveryService broadcasts every 5 seconds
    const interval = setInterval(fetchNodes, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (lastSeen) => {
    const secondsAgo = (Date.now() - lastSeen) / 1000;
    if (secondsAgo < 15) return 'text-green-500 bg-green-50 ring-green-500/20';
    if (secondsAgo < 60) return 'text-yellow-600 bg-yellow-50 ring-yellow-600/20';
    return 'text-slate-500 bg-slate-50 ring-slate-500/20';
  };

  const getStatusText = (lastSeen) => {
    const secondsAgo = Math.floor((Date.now() - lastSeen) / 1000);
    if (secondsAgo < 15) return 'Online';
    if (secondsAgo < 60) return `Last seen ${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `Last seen ${minutesAgo}m ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Local Network Devices</h1>
          <p className="text-slate-500 mt-1">Computers currently discovered on your local hospital network.</p>
        </div>
        <button
          onClick={fetchNodes}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
        >
          <SignalIcon className="mr-2 h-4 w-4 text-slate-500" />
          Refresh
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-medium text-slate-800 mb-4">Cloud Backend Configuration</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cloud Sync URL Endpoint
            </label>
            <input
              type="text"
              value={cloudUrl}
              onChange={(e) => setCloudUrl(e.target.value)}
              placeholder="http://localhost:5000/api/v1/sync"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleSaveCloudUrl}
            disabled={savingUrl}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingUrl ? 'Saving...' : 'Save Config'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Render Self Card (Mocked for context, since DiscoveryService filters out self, we just show "This Computer") */}
        <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
             <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 ring-1 ring-inset ring-indigo-700/10">
               This Computer
             </span>
          </div>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                <ServerStackIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-indigo-900">Local Instance</h3>
                <p className="text-sm text-indigo-600 flex items-center mt-1">
                  <WifiIcon className="h-4 w-4 mr-1" />
                  Broadcasting
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Render Discovered Peers */}
        {nodes.map((node) => {
          const statusClass = getStatusColor(node.lastSeen);
          
          return (
            <div key={node.nodeId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group hover:border-slate-300 transition-colors">
              <div className="absolute top-0 right-0 p-4">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass}`}>
                  {getStatusText(node.lastSeen)}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-slate-100 rounded-lg p-3">
                    <ComputerDesktopIcon className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="ml-4 pr-16 truncate">
                    <h3 className="text-sm font-medium text-slate-900 truncate" title={node.nodeId}>
                      Node: {node.nodeId.substring(0, 8)}...
                    </h3>
                    <p className="text-sm text-slate-500 font-mono mt-1">
                      {node.ip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && nodes.length === 0 && (
        <div className="text-center bg-white rounded-xl border border-dashed border-slate-300 p-12">
          <WifiIcon className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No peers discovered</h3>
          <p className="mt-1 text-sm text-slate-500">
            Waiting for other computers on the LAN to broadcast their presence...
          </p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { Device, DevicesResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7241';

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`);
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data: DevicesResponse = await response.json();
      setDevices(data.devices || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading devices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchDevices}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Connected Devices ({devices.length})
        </h2>
        <button
          onClick={fetchDevices}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No devices connected
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-3">
          {devices.map((device) => (
            <div
              key={device.mac}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-lg font-semibold text-gray-800">
                      {device.mac}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                  </div>
                  {device.signal_info && (
                    <div className="text-sm text-gray-600">
                      Signal: {device.signal_info}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {device.time_left_minutes}m
                  </div>
                  <div className="text-xs text-gray-500">remaining</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-gray-100">
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{device.duration_minutes}min</span>
                </div>
                <div>
                  <span className="text-gray-500">Granted:</span>
                  <span className="ml-2 font-medium">{formatTime(device.granted_at)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Expires:</span>
                  <span className="ml-2 font-medium">{formatTime(device.expires_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

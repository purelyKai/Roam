import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7241';

export default function LogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectToStream = () => {
      try {
        const eventSource = new EventSource(`${API_BASE_URL}/api/logs/stream`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('Connected to log stream');
          setConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLogs((prev) => [...prev, data].slice(-500)); // Keep last 500 logs
          } catch (err) {
            console.error('Failed to parse log entry:', err);
          }
        };

        eventSource.onerror = () => {
          console.error('Log stream error');
          setConnected(false);
          setError('Connection lost. Attempting to reconnect...');
          eventSource.close();
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connectToStream, 3000);
        };
      } catch (err) {
        console.error('Failed to connect to log stream:', err);
        setError('Failed to connect to log stream');
      }
    };

    connectToStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogStyle = (message: string) => {
    if (message.includes('ERROR') || message.includes('❌')) {
      return 'text-red-600';
    }
    if (message.includes('WARN') || message.includes('⚠️')) {
      return 'text-yellow-600';
    }
    if (message.includes('✅') || message.includes('SUCCESS')) {
      return 'text-green-600';
    }
    if (message.includes('🚀') || message.includes('Starting')) {
      return 'text-blue-600';
    }
    return 'text-gray-700';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Live Logs</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          {error}
        </div>
      )}

      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Waiting for logs...
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-3">
                <span className="text-gray-500 shrink-0">
                  {log.timestamp ? formatTimestamp(log.timestamp) : ''}
                </span>
                <span className={`flex-1 ${getLogStyle(log.message)}`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500 text-right">
        {logs.length} log entries
      </div>
    </div>
  );
}

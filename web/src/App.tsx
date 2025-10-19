import DeviceList from './components/DeviceList';
import LogStream from './components/LogStream';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🌐 Roam Edge Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time monitoring of connected devices and system logs
          </p>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="max-w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - Devices */}
          <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden">
            <DeviceList />
          </div>

          {/* Right Panel - Logs */}
          <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden">
            <LogStream />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

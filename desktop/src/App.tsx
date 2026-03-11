import { LogOut, Settings } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useVpn } from "./hooks/useVpn";
import { LoginForm } from "./components/LoginForm";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { TrafficStats } from "./components/TrafficStats";
import { DeviceList } from "./components/DeviceList";
import { api } from "./lib/api";

function App() {
  const { user, isLoggedIn, loading, error, login, register, logout } = useAuth();
  const { status, activeDeviceId, connect, disconnect } = useVpn();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={login} onRegister={register} error={error} />;
  }

  const handleQuickConnect = async () => {
    // Get first device or create one
    const devices = await api.listDevices();
    if (devices.length > 0) {
      const device = devices[0];
      // Re-fetch config for the device
      const newDevice = await api.createDevice(device.name + "-session");
      if (newDevice.config) {
        connect(newDevice.id, newDevice.config);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <h1 className="text-sm font-bold">Kokoro VPN</h1>
          <p className="text-xs text-gray-500">{user?.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg">
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <ConnectionStatus
          status={status}
          onConnect={handleQuickConnect}
          onDisconnect={disconnect}
        />

        {status === "connected" && <TrafficStats />}

        <DeviceList onConnect={connect} activeDeviceId={activeDeviceId} />
      </main>
    </div>
  );
}

export default App;

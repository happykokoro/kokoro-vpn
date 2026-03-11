import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ShieldOff,
  Loader2,
  LogOut,
  Settings,
  ArrowDown,
  ArrowUp,
  Monitor,
  Smartphone,
  Plus,
  Trash2,
  Download,
  Server,
  LogIn,
  Info,
} from "lucide-react";

type VpnStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

interface MockDevice {
  id: string;
  name: string;
  address: string;
  icon: "desktop" | "mobile";
}

const MOCK_DEVICES: MockDevice[] = [
  { id: "1", name: "My Laptop", address: "10.8.0.2/32", icon: "desktop" },
  { id: "2", name: "Work Phone", address: "10.8.0.3/32", icon: "mobile" },
];

// --- Demo Login Screen ---
function DemoLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Kokoro VPN</h1>
          <p className="text-gray-400 mt-1">Secure. Private. Fast.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Server URL</label>
            <input
              type="text"
              value="https://vpn.kokoro.org"
              readOnly
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="demo"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter any password"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <p className="text-xs text-gray-500 text-center">
            This is a demo. Enter anything to continue.
          </p>
        </form>
      </div>
    </div>
  );
}

// --- Connection Status ---
function DemoConnectionStatus({
  status,
  onToggle,
}: {
  status: VpnStatus;
  onToggle: () => void;
}) {
  const configs: Record<VpnStatus, { icon: typeof Shield; label: string; color: string; ring: string; bg: string; button: string; buttonColor: string }> = {
    disconnected: { icon: ShieldOff, label: "Not Protected", color: "text-gray-400", ring: "ring-gray-600", bg: "bg-gray-800", button: "Connect", buttonColor: "bg-green-600 hover:bg-green-500" },
    connecting: { icon: Loader2, label: "Connecting...", color: "text-yellow-400", ring: "ring-yellow-600", bg: "bg-yellow-900/20", button: "Connecting", buttonColor: "bg-yellow-600 opacity-50" },
    connected: { icon: Shield, label: "Protected", color: "text-green-400", ring: "ring-green-600", bg: "bg-green-900/20", button: "Disconnect", buttonColor: "bg-red-600 hover:bg-red-500" },
    disconnecting: { icon: Loader2, label: "Disconnecting...", color: "text-yellow-400", ring: "ring-yellow-600", bg: "bg-yellow-900/20", button: "Disconnecting", buttonColor: "bg-yellow-600 opacity-50" },
  };

  const c = configs[status];
  const Icon = c.icon;
  const spinning = status === "connecting" || status === "disconnecting";

  return (
    <div className="flex flex-col items-center py-6">
      <div className={`w-28 h-28 rounded-full ${c.bg} ring-4 ${c.ring} flex items-center justify-center mb-4 transition-all duration-300`}>
        <Icon className={`w-14 h-14 ${c.color} ${spinning ? "animate-spin" : ""}`} />
      </div>
      <p className={`text-base font-semibold ${c.color} mb-4`}>{c.label}</p>
      <button
        onClick={onToggle}
        disabled={spinning}
        className={`px-6 py-2.5 rounded-full font-medium text-white text-sm ${c.buttonColor} transition-colors disabled:cursor-not-allowed`}
      >
        {c.button}
      </button>
    </div>
  );
}

// --- Traffic Stats (simulated) ---
function DemoTrafficStats({ active }: { active: boolean }) {
  const [rx, setRx] = useState(0);
  const [tx, setTx] = useState(0);

  useEffect(() => {
    if (!active) { setRx(0); setTx(0); return; }
    const interval = setInterval(() => {
      setRx((prev) => prev + Math.floor(Math.random() * 500000 + 100000));
      setTx((prev) => prev + Math.floor(Math.random() * 200000 + 50000));
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const fmt = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-800/50 rounded-xl p-3">
        <div className="flex items-center gap-2 text-green-400 mb-1">
          <ArrowDown className="w-3.5 h-3.5" />
          <span className="text-xs font-medium uppercase">Download</span>
        </div>
        <p className="text-lg font-bold">{fmt(rx)}</p>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-3">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="text-xs font-medium uppercase">Upload</span>
        </div>
        <p className="text-lg font-bold">{fmt(tx)}</p>
      </div>
    </div>
  );
}

// --- Device List ---
function DemoDeviceList({ devices }: { devices: MockDevice[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-gray-400 uppercase">Devices</h2>
        <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {devices.map((d) => (
        <div key={d.id} className="p-2.5 rounded-xl border bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {d.icon === "mobile" ? <Smartphone className="w-4 h-4 text-gray-400" /> : <Monitor className="w-4 h-4 text-gray-400" />}
              <div>
                <p className="font-medium text-xs">{d.name}</p>
                <p className="text-xs text-gray-500">{d.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="p-1 text-gray-400 hover:text-white transition-colors"><Download className="w-3.5 h-3.5" /></button>
              <button className="p-1 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Demo App ---
export function DemoApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>("disconnected");

  const toggleVpn = useCallback(() => {
    if (vpnStatus === "disconnected") {
      setVpnStatus("connecting");
      setTimeout(() => setVpnStatus("connected"), 1500);
    } else if (vpnStatus === "connected") {
      setVpnStatus("disconnecting");
      setTimeout(() => setVpnStatus("disconnected"), 1000);
    }
  }, [vpnStatus]);

  return (
    <div className="py-16 px-4">
      <div className="max-w-md mx-auto">
        {/* Demo banner */}
        <div className="mb-6 flex items-start gap-2 p-3 bg-indigo-900/30 border border-indigo-700/50 rounded-xl">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-300">
            <span className="font-medium">Interactive Demo</span> — This is a simulated preview of the Kokoro VPN desktop app. All data is fake. No real VPN connection is made.
          </p>
        </div>

        {/* App frame */}
        <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-gray-500 ml-2">Kokoro VPN</span>
          </div>

          {/* App content */}
          <div className="min-h-[480px]">
            {!loggedIn ? (
              <DemoLogin onLogin={() => setLoggedIn(true)} />
            ) : (
              <div className="flex flex-col h-full">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                  <div>
                    <h1 className="text-xs font-bold">Kokoro VPN</h1>
                    <p className="text-xs text-gray-500">demo</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setLoggedIn(false); setVpnStatus("disconnected"); }}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </header>

                {/* Main */}
                <main className="flex-1 p-4 space-y-4">
                  <DemoConnectionStatus status={vpnStatus} onToggle={toggleVpn} />
                  {vpnStatus === "connected" && <DemoTrafficStats active />}
                  <DemoDeviceList devices={MOCK_DEVICES} />
                </main>
              </div>
            )}
          </div>
        </div>

        {/* Download CTA */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-3">Like what you see?</p>
          <a
            href="https://github.com/happykokoro/kokoro-vpn/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Desktop App
          </a>
        </div>
      </div>
    </div>
  );
}

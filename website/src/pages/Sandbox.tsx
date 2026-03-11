import { useState, useEffect } from "react";
import { Shield, Clock, Gauge, Download, Copy, Check, Info } from "lucide-react";

const DEMO_CONFIG = `[Interface]
# DEMO CONFIG - NOT A REAL VPN
PrivateKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Address = 10.8.0.42/32
DNS = 1.1.1.1, 9.9.9.9

[Peer]
PublicKey = BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=
Endpoint = demo.kokoro.org:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25`;

export function Sandbox() {
  const [started, setStarted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [bandwidthUsed, setBandwidthUsed] = useState(0);

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
      setBandwidthUsed((b) => Math.min(100, b + Math.random() * 0.3));
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const copyConfig = async () => {
    await navigator.clipboard.writeText(DEMO_CONFIG);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-20 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Try Kokoro VPN</h1>
          <p className="text-gray-400">
            See how the guest sandbox experience works. No server required.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-2 p-3 bg-indigo-900/30 border border-indigo-700/50 rounded-xl">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-300">
            <span className="font-medium">Demo Mode</span> — This shows a
            simulated guest experience. The config below is fake and will not
            create a real VPN tunnel.
          </p>
        </div>

        {!started ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <Clock className="w-6 h-6 text-yellow-400 mb-2" />
                <p className="text-sm font-medium">30 min session</p>
                <p className="text-xs text-gray-500">Auto-expires</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <Gauge className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-sm font-medium">100 MB data</p>
                <p className="text-xs text-gray-500">Bandwidth limit</p>
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
            >
              Start Demo Session
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <Clock className="w-5 h-5 text-yellow-400 mb-1" />
                <p className="text-lg font-bold font-mono">{formatTime(timeLeft)}</p>
                <p className="text-xs text-gray-500">Time remaining</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <Gauge className="w-5 h-5 text-blue-400 mb-1" />
                <p className="text-lg font-bold">{bandwidthUsed.toFixed(1)} MB</p>
                <p className="text-xs text-gray-500">of 100 MB used</p>
                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${bandwidthUsed}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                WireGuard Config
              </h3>
              <pre className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {DEMO_CONFIG}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([DEMO_CONFIG], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "kokoro-vpn-demo.conf";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download .conf
              </button>
              <button
                onClick={copyConfig}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-sm text-gray-400 space-y-2">
              <p className="font-medium text-white">How it works in production:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Deploy your own Kokoro VPN server</li>
                <li>Guests visit the sandbox page and get a real config</li>
                <li>Import into WireGuard app and connect</li>
                <li>Session auto-expires after the time limit</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

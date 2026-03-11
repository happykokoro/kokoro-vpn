import { useState } from "react";
import { Shield, Clock, Gauge, Download, Copy, Check } from "lucide-react";

interface GuestResponse {
  token: string;
  config: string;
  expires_at: string;
  bandwidth_limit_mb: number;
}

export function Sandbox() {
  const [guestData, setGuestData] = useState<GuestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sandboxUrl =
    localStorage.getItem("kokoro-vpn-sandbox") || "";

  const createGuest = async () => {
    if (!sandboxUrl) {
      setError("Sandbox server URL not configured");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${sandboxUrl}/api/sandbox/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create guest account");
      }

      const data: GuestResponse = await res.json();
      setGuestData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const downloadConfig = () => {
    if (!guestData) return;
    const blob = new Blob([guestData.config], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kokoro-vpn-guest.conf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyConfig = async () => {
    if (!guestData) return;
    await navigator.clipboard.writeText(guestData.config);
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
            Get a free guest account to test the VPN. No signup required.
          </p>
        </div>

        {!guestData ? (
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

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Sandbox Server URL
              </label>
              <input
                type="url"
                value={sandboxUrl}
                onChange={(e) => {
                  localStorage.setItem("kokoro-vpn-sandbox", e.target.value);
                }}
                placeholder="https://sandbox.vpn.example.org"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={createGuest}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-medium transition-colors"
            >
              {loading ? "Creating..." : "Get Guest Access"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-xl">
              <p className="text-green-400 font-medium mb-1">
                Guest account created!
              </p>
              <p className="text-sm text-gray-400">
                Expires: {guestData.expires_at} | Limit:{" "}
                {guestData.bandwidth_limit_mb} MB
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                WireGuard Config
              </h3>
              <pre className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {guestData.config}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadConfig}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download .conf
              </button>
              <button
                onClick={copyConfig}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="text-sm text-gray-400 space-y-2">
              <p className="font-medium text-white">How to connect:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the WireGuard app for your device</li>
                <li>Import the config file above</li>
                <li>Activate the tunnel</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";

export type VpnStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

export function useVpn() {
  const [status, setStatus] = useState<VpnStatus>("disconnected");
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  const connect = useCallback(async (deviceId: string, config: string) => {
    setStatus("connecting");
    setActiveDeviceId(deviceId);

    try {
      // In Tauri, this would invoke the Rust backend to start WireGuard tunnel
      // For now, simulate with the Tauri API
      if (window.__TAURI__) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("vpn_connect", { config });
      }
      setStatus("connected");
    } catch (e) {
      setStatus("disconnected");
      setActiveDeviceId(null);
      throw e;
    }
  }, []);

  const disconnect = useCallback(async () => {
    setStatus("disconnecting");
    try {
      if (window.__TAURI__) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("vpn_disconnect");
      }
      setStatus("disconnected");
      setActiveDeviceId(null);
    } catch (e) {
      setStatus("connected"); // revert
      throw e;
    }
  }, []);

  return { status, activeDeviceId, connect, disconnect };
}

// Augment Window for Tauri detection
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

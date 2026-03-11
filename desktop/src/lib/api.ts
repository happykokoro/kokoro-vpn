const API_BASE = localStorage.getItem("kokoro-vpn-server") || "http://localhost:3000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("kokoro-vpn-token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface AuthResponse {
  token: string;
  user: { id: string; username: string; role: string };
}

export interface Device {
  id: string;
  name: string;
  address: string;
  public_key: string;
  config?: string;
  created_at: string;
  last_seen?: string;
}

export interface DeviceStats {
  device_id: string;
  name: string;
  rx_bytes: number;
  tx_bytes: number;
  last_handshake: number;
}

export interface ServerProfile {
  id: string;
  name: string;
  endpoint: string;
  public_key: string;
  dns: string;
  allowed_ips: string;
  is_active: boolean;
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request<AuthResponse["user"]>("/api/users/me"),

  createDevice: (name: string) =>
    request<Device>("/api/devices", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  listDevices: () => request<Device[]>("/api/devices"),

  deleteDevice: (id: string) =>
    request<void>(`/api/devices/${id}`, { method: "DELETE" }),

  getStats: () =>
    request<{ devices: DeviceStats[] }>("/api/wg/stats"),

  getServers: () => request<ServerProfile[]>("/api/servers"),
};

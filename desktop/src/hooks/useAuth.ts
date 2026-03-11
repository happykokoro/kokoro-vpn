import { useState, useCallback, useEffect } from "react";
import { api, type AuthResponse } from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  useEffect(() => {
    const token = localStorage.getItem("kokoro-vpn-token");
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("kokoro-vpn-token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const res = await api.login(username, password);
      localStorage.setItem("kokoro-vpn-token", res.token);
      setUser(res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      throw e;
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const res = await api.register(username, password);
      localStorage.setItem("kokoro-vpn-token", res.token);
      setUser(res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("kokoro-vpn-token");
    setUser(null);
  }, []);

  return { user, isLoggedIn, loading, error, login, register, logout };
}

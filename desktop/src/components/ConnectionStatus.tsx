import { Shield, ShieldOff, Loader2 } from "lucide-react";
import type { VpnStatus } from "../hooks/useVpn";

interface ConnectionStatusProps {
  status: VpnStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

const statusConfig = {
  disconnected: {
    icon: ShieldOff,
    label: "Not Protected",
    color: "text-gray-400",
    ring: "ring-gray-600",
    bg: "bg-gray-800",
    button: "Connect",
    buttonColor: "bg-green-600 hover:bg-green-500",
  },
  connecting: {
    icon: Loader2,
    label: "Connecting...",
    color: "text-yellow-400",
    ring: "ring-yellow-600",
    bg: "bg-yellow-900/20",
    button: "Connecting",
    buttonColor: "bg-yellow-600 opacity-50",
  },
  connected: {
    icon: Shield,
    label: "Protected",
    color: "text-green-400",
    ring: "ring-green-600",
    bg: "bg-green-900/20",
    button: "Disconnect",
    buttonColor: "bg-red-600 hover:bg-red-500",
  },
  disconnecting: {
    icon: Loader2,
    label: "Disconnecting...",
    color: "text-yellow-400",
    ring: "ring-yellow-600",
    bg: "bg-yellow-900/20",
    button: "Disconnecting",
    buttonColor: "bg-yellow-600 opacity-50",
  },
};

export function ConnectionStatus({
  status,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isTransitioning = status === "connecting" || status === "disconnecting";

  return (
    <div className="flex flex-col items-center py-8">
      <div
        className={`w-32 h-32 rounded-full ${config.bg} ring-4 ${config.ring} flex items-center justify-center mb-6 transition-all duration-300`}
      >
        <Icon
          className={`w-16 h-16 ${config.color} ${
            isTransitioning ? "animate-spin" : ""
          }`}
        />
      </div>

      <p className={`text-lg font-semibold ${config.color} mb-6`}>
        {config.label}
      </p>

      <button
        onClick={status === "connected" ? onDisconnect : onConnect}
        disabled={isTransitioning}
        className={`px-8 py-3 rounded-full font-medium text-white ${config.buttonColor} transition-colors disabled:cursor-not-allowed`}
      >
        {config.button}
      </button>
    </div>
  );
}

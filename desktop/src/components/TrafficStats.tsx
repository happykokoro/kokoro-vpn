import { ArrowDown, ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function TrafficStats() {
  const { data } = useQuery({
    queryKey: ["vpn-stats"],
    queryFn: api.getStats,
    refetchInterval: 5000,
  });

  const totalRx = data?.devices.reduce((sum, d) => sum + d.rx_bytes, 0) ?? 0;
  const totalTx = data?.devices.reduce((sum, d) => sum + d.tx_bytes, 0) ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-green-400 mb-1">
          <ArrowDown className="w-4 h-4" />
          <span className="text-xs font-medium uppercase">Download</span>
        </div>
        <p className="text-xl font-bold">{formatBytes(totalRx)}</p>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <ArrowUp className="w-4 h-4" />
          <span className="text-xs font-medium uppercase">Upload</span>
        </div>
        <p className="text-xl font-bold">{formatBytes(totalTx)}</p>
      </div>
    </div>
  );
}

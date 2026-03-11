import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Monitor, Smartphone, Download } from "lucide-react";
import { api, type Device } from "../lib/api";

interface DeviceListProps {
  onConnect: (deviceId: string, config: string) => void;
  activeDeviceId: string | null;
}

export function DeviceList({ onConnect, activeDeviceId }: DeviceListProps) {
  const [newDeviceName, setNewDeviceName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: api.listDevices,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.createDevice(name),
    onSuccess: (newDevice) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setNewDeviceName("");
      setShowAdd(false);
      // Auto-connect with the new device
      if (newDevice.config) {
        onConnect(newDevice.id, newDevice.config);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteDevice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });

  const downloadConfig = (device: Device) => {
    if (!device.config) return;
    const blob = new Blob([device.config], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kokoro-vpn-${device.name}.conf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400 uppercase">Devices</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newDeviceName.trim()) {
              createMutation.mutate(newDeviceName.trim());
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="Device name (e.g., My Laptop)"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}

      {devices.map((device) => (
        <div
          key={device.id}
          className={`p-3 rounded-xl border transition-colors ${
            activeDeviceId === device.id
              ? "bg-indigo-900/30 border-indigo-600"
              : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {device.name.toLowerCase().includes("phone") ||
              device.name.toLowerCase().includes("mobile") ? (
                <Smartphone className="w-5 h-5 text-gray-400" />
              ) : (
                <Monitor className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-sm">{device.name}</p>
                <p className="text-xs text-gray-500">{device.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {device.config && (
                <button
                  onClick={() => downloadConfig(device)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  title="Download config"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => deleteMutation.mutate(device.id)}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove device"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {devices.length === 0 && !showAdd && (
        <p className="text-sm text-gray-500 text-center py-4">
          No devices yet. Click + to add one.
        </p>
      )}
    </div>
  );
}

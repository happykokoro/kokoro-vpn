import {
  Shield,
  Zap,
  Globe,
  Monitor,
  Smartphone,
  Server,
  Lock,
  Eye,
  Download,
} from "lucide-react";

interface LandingProps {
  onTrySandbox: () => void;
  onTryDemo: () => void;
}

export function Landing({ onTrySandbox, onTryDemo }: LandingProps) {
  return (
    <div>
      {/* Hero */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Your own VPN.
            <br />
            <span className="text-indigo-400">Your own rules.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
            Self-hosted WireGuard VPN with a beautiful desktop app. Deploy in
            minutes, connect from anywhere.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onTryDemo}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
            >
              Live Demo
            </button>
            <button
              onClick={onTrySandbox}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
            >
              Try Sandbox
            </button>
            <a
              href="https://github.com/happykokoro/kokoro-vpn"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "WireGuard protocol delivers speeds that leave OpenVPN in the dust.",
              },
              {
                icon: Lock,
                title: "Truly Private",
                desc: "Self-hosted means your data never touches third-party servers.",
              },
              {
                icon: Globe,
                title: "Access Anywhere",
                desc: "Connect from Windows, macOS, iOS, Android, or Linux.",
              },
              {
                icon: Server,
                title: "One-Click Deploy",
                desc: "Single script sets up everything on any VPS. $5/month is all you need.",
              },
              {
                icon: Eye,
                title: "Web Dashboard",
                desc: "Manage users, devices, and traffic stats from a clean web UI.",
              },
              {
                icon: Download,
                title: "Desktop App",
                desc: "Native app for Windows and macOS. Connect with one click.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700"
              >
                <Icon className="w-8 h-8 text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Works on all platforms</h2>
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <Monitor className="w-10 h-10 text-gray-300" />
              <span className="text-sm text-gray-400">Windows</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Monitor className="w-10 h-10 text-gray-300" />
              <span className="text-sm text-gray-400">macOS</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Monitor className="w-10 h-10 text-gray-300" />
              <span className="text-sm text-gray-400">Linux</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Smartphone className="w-10 h-10 text-gray-300" />
              <span className="text-sm text-gray-400">iOS</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Smartphone className="w-10 h-10 text-gray-300" />
              <span className="text-sm text-gray-400">Android</span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Architecture</h2>
          <pre className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-sm text-gray-300 overflow-x-auto">
{`┌─────────────────────────────────────┐
│              VPS                     │
│  ┌───────────────────────────────┐  │
│  │  Axum API Server              │  │
│  │  ├─ JWT Auth + SQLite         │  │
│  │  └─ WireGuard Manager         │  │
│  └───────────────┬───────────────┘  │
│                  │                   │
│  ┌───────────────┴───────────────┐  │
│  │  WireGuard  :51820/udp        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ▲           ▲           ▲
         │           │           │
    ┌────┴───┐  ┌────┴───┐ ┌────┴───┐
    │Desktop │  │ Phone  │ │  Web   │
    │  App   │  │  App   │ │  Demo  │
    └────────┘  └────────┘ └────────┘`}
          </pre>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
        <p className="text-gray-400 mb-8">
          Deploy your own VPN in under 5 minutes.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={onTryDemo}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
          >
            Try the Demo
          </button>
          <a
            href="https://github.com/happykokoro/kokoro-vpn"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
          >
            Deploy Your Own
          </a>
        </div>
      </section>
    </div>
  );
}

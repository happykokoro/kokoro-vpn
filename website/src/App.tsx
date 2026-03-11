import { Landing } from "./pages/Landing";
import { Sandbox } from "./pages/Sandbox";
import { useState } from "react";

function App() {
  const [page, setPage] = useState<"landing" | "sandbox">("landing");

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setPage("landing")}
            className="text-lg font-bold text-white"
          >
            Kokoro VPN
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage("landing")}
              className={`text-sm ${page === "landing" ? "text-white" : "text-gray-400 hover:text-white"} transition-colors`}
            >
              Home
            </button>
            <button
              onClick={() => setPage("sandbox")}
              className={`text-sm px-4 py-1.5 rounded-full ${
                page === "sandbox"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } transition-colors`}
            >
              Try It Free
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-14">
        {page === "landing" ? <Landing onTrySandbox={() => setPage("sandbox")} /> : <Sandbox />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p>Built by happykokoro. Open source on GitHub.</p>
      </footer>
    </div>
  );
}

export default App;

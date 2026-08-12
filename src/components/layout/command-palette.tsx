"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useUIStore } from "@/stores/ui-store";
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Video,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState("");

  // Listen for global Cmd+K or Ctrl+K shortcut keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const items = [
    { label: "Go to Dashboard", category: "Navigation", icon: LayoutDashboard, action: () => router.push("/dashboard") },
    { label: "Go to Messages", category: "Navigation", icon: MessageSquare, action: () => router.push("/dashboard/messages") },
    { label: "Go to Meetings", category: "Navigation", icon: Video, action: () => router.push("/dashboard/meetings") },
    { label: "Go to Settings", category: "Navigation", icon: Settings, action: () => router.push("/dashboard/settings") },
    { label: "Toggle Dark Theme", category: "Appearance", icon: Moon, action: () => setTheme("dark") },
    { label: "Toggle Light Theme", category: "Appearance", icon: Sun, action: () => setTheme("light") },
  ];

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 select-none">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Command Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl relative z-10 overflow-hidden"
          >
            {/* Search Input box */}
            <div className="flex items-center gap-3 px-4 border-b border-border/60">
              <Search className="w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-4 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
                autoFocus
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-bg-secondary text-text-muted"
              >
                ESC
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filteredItems.length > 0 ? (
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          setCommandPaletteOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs text-text-secondary hover:text-text-primary hover:bg-card-hover transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] text-text-muted group-hover:text-text-secondary capitalize">
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted text-xs">
                  No commands match your query.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, Bell, Sun, Moon, Menu, Check } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface NavbarProps {
  user: {
    id: string;
    displayName: string | null;
    imageUrl: string | null;
    email: string;
    status: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar, setCommandPaletteOpen } = useUIStore();
  
  const [status, setStatus] = useState(user.status);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format header title based on current pathname
  const getHeaderTitle = () => {
    if (pathname.includes("/messages")) return "Messages";
    if (pathname.includes("/meetings")) return "Meetings";
    if (pathname.includes("/settings")) return "Settings";
    return "Dashboard";
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatus(newStatus);
      setDropdownOpen(false);
      await fetch("/api/user/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const statusColors: Record<string, string> = {
    ONLINE: "bg-emerald-500",
    AWAY: "bg-amber-500",
    BUSY: "bg-rose-500",
    OFFLINE: "bg-slate-500",
  };

  return (
    <header className="h-20 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md relative z-10 select-none">
      {/* Left side: mobile toggle + Page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 md:hidden rounded-lg text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-text-primary">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Center: Search / Command Palette trigger */}
      <div className="hidden sm:block max-w-md w-72 md:w-96">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-bg-secondary border border-border text-text-muted hover:border-accent/50 hover:text-text-secondary transition-all text-sm group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 group-hover:text-accent transition-colors" />
            <span>Search or command...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center h-5 select-none pointer-events-none px-1.5 font-mono text-[10px] font-medium text-text-muted bg-sidebar-hover border border-border rounded-md gap-0.5">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: quick actions */}
      <div className="flex items-center gap-3">
        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-sidebar-hover transition-colors text-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || "bg-emerald-500"}`} />
            <span className="capitalize">{status.toLowerCase()}</span>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-fadeInUp">
                {["ONLINE", "AWAY", "BUSY", "OFFLINE"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${statusColors[s]}`} />
                      <span className="capitalize">{s.toLowerCase()}</span>
                    </div>
                    {status === s && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <button className="p-2.5 rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors min-w-9 min-h-9 flex items-center justify-center"
        >
          {!mounted ? (
            <div className="w-4 h-4" />
          ) : theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}

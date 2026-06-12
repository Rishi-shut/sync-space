"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Check,
  LayoutDashboard,
  MessageSquare,
  Video as VideoIcon,
  Settings as SettingsIcon,
} from "lucide-react";
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useUIStore();
  
  const [status, setStatus] = useState(user.status);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Inline search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchItems = [
    { label: "Go to Dashboard", category: "Navigation", icon: LayoutDashboard, action: () => router.push("/dashboard") },
    { label: "Go to Messages", category: "Navigation", icon: MessageSquare, action: () => router.push("/dashboard/messages") },
    { label: "Go to Meetings", category: "Navigation", icon: VideoIcon, action: () => router.push("/dashboard/meetings") },
    { label: "Go to Settings", category: "Navigation", icon: SettingsIcon, action: () => router.push("/dashboard/settings") },
    { label: "Toggle Dark Theme", category: "Appearance", icon: Moon, action: () => setTheme("dark") },
    { label: "Toggle Light Theme", category: "Appearance", icon: Sun, action: () => setTheme("light") },
  ];

  const filteredSearchItems = searchItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Center: Inline Search with Dropdown Results */}
      <div className="hidden sm:block max-w-md w-72 md:w-96 relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search dashboard, pages, tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none text-xs transition-all"
          />
        </div>

        {/* Dropdown Results */}
        {isSearchFocused && searchQuery.trim() !== "" && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card p-2 shadow-2xl z-50 animate-fadeInUp max-h-80 overflow-y-auto">
            {filteredSearchItems.length > 0 ? (
              <div className="space-y-1">
                {filteredSearchItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onMouseDown={() => item.action()}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[11px] text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[9px] text-text-muted group-hover:text-text-secondary capitalize">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-text-muted text-[11px]">
                No results found
              </div>
            )}
          </div>
        )}
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

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
  Phone,
  PhoneOff,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import Image from "next/image";

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

  // Notification states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Active voice call states
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [declinedCalls, setDeclinedCalls] = useState<string[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.incoming || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchActiveCalls = async () => {
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const calls = await res.json();
        const activeCall = calls.find((c: any) => !declinedCalls.includes(c.id));
        if (activeCall) {
          setIncomingCall(activeCall);
        } else {
          setIncomingCall(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch active calls:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, 5000);
    return () => clearInterval(interval);
  }, [declinedCalls]);

  const handleNotifAction = async (friendshipId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });
      if (res.ok) {
        fetchNotifications();
        router.refresh();
      } else {
        const err = await res.text();
        alert(err || "Failed to handle notification request");
      }
    } catch (err) {
      console.error("Error handling notification request:", err);
    }
  };

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
    <>
    <header className="h-20 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md relative z-30 select-none">
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

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors relative cursor-pointer flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-sm animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-fadeInUp max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                  <h3 className="text-xs font-bold text-text-primary">Notifications</h3>
                  <span className="text-[9px] bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">
                    {notifications.length} Pending
                  </span>
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((item: any) => (
                      <div key={item.friendshipId} className="flex flex-col gap-2 p-2.5 rounded-xl bg-bg-secondary border border-border/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg overflow-hidden border border-border relative flex-shrink-0">
                            {item.requester?.imageUrl ? (
                              <Image
                                src={item.requester.imageUrl}
                                alt={item.requester.displayName || "User"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-sidebar-hover flex items-center justify-center text-[10px] font-bold text-accent">
                                {item.requester?.displayName?.[0] || "U"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-text-primary truncate">
                              {item.requester?.displayName || item.requester?.email || "New User"}
                            </p>
                            <p className="text-[8px] text-text-secondary truncate">
                              Sent you a friend request
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleNotifAction(item.friendshipId, "ACCEPT")}
                            className="flex-1 btn-primary py-1 px-2 text-[9px] font-bold justify-center rounded-lg cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleNotifAction(item.friendshipId, "DECLINE")}
                            className="flex-1 btn-secondary py-1 px-2 text-[9px] font-bold justify-center rounded-lg cursor-pointer text-text-secondary hover:text-rose-500 hover:border-rose-500/30"
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-text-muted">
                    <Bell className="w-6 h-6 mb-1.5 opacity-40" />
                    <p className="text-[10px]">No new notifications</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

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
    {incomingCall && (
      <div className="fixed bottom-6 right-6 z-50 animate-fadeInUp max-w-sm w-full bg-[#090c15] border border-accent/20 rounded-3xl p-5 shadow-2xl shadow-accent/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent relative flex-shrink-0">
              {incomingCall.createdBy.imageUrl ? (
                <Image
                  src={incomingCall.createdBy.imageUrl}
                  alt={incomingCall.createdBy.displayName || "Friend"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  {incomingCall.createdBy.displayName?.[0] || "F"}
                </div>
              )}
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white uppercase tracking-wider animate-pulse">
              Incoming Voice Call
            </p>
            <p className="text-sm font-semibold text-text-primary truncate">
              {incomingCall.createdBy.displayName || "Friend"}
            </p>
            <p className="text-[10px] text-text-secondary">
              Calling you...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => {
              router.push(`/dashboard/meetings/${incomingCall.code}`);
              setIncomingCall(null);
            }}
            className="flex-1 btn-primary py-2 text-xs font-bold justify-center rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-accent/15"
          >
            <Phone className="w-4 h-4" />
            <span>Accept</span>
          </button>
          <button
            onClick={() => {
              setDeclinedCalls((prev) => [...prev, incomingCall.id]);
              setIncomingCall(null);
            }}
            className="flex-1 btn-secondary py-2 text-xs font-bold justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>
        </div>
      </div>
    )}
    </>
  );
}

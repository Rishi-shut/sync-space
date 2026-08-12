"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Bell,
  Check,
  Command,
  LayoutGrid,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  PhoneOff,
  Search,
  Settings,
  Sun,
  Users,
  Video,
  X,
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

interface PersonSummary {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
  email?: string;
}

interface FriendRequest {
  friendshipId: string;
  requester: PersonSummary;
}

interface IncomingCall {
  id: string;
  code: string;
  type: "VOICE" | "VIDEO" | "SCREEN_SHARE";
  createdBy: PersonSummary;
}

const pageDetails = [
  { match: "/dashboard/messages", title: "Messages", detail: "Conversations and shared files" },
  { match: "/dashboard/meetings", title: "Meetings", detail: "Rooms, calls, and your schedule" },
  { match: "/dashboard/friends", title: "People", detail: "Friends and connection requests" },
  { match: "/dashboard/settings", title: "Settings", detail: "Profile, presence, and preferences" },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar, addToast } = useUIStore();

  const [status, setStatus] = useState(user.status);
  const [statusOpen, setStatusOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [dismissedCallIds, setDismissedCallIds] = useState<string[]>([]);

  const page = pageDetails.find((item) => pathname.startsWith(item.match)) ?? {
    title: "Home",
    detail: "Your communication workspace",
  };

  const loadRequests = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const response = await fetch("/api/friends", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setRequests(data.incoming ?? []);
    } catch {
      // Keep current notifications through brief connection changes.
    }
  }, []);

  const loadCalls = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const response = await fetch("/api/meetings", { cache: "no-store" });
      if (!response.ok) return;
      const calls = await response.json() as IncomingCall[];
      const nextCall = calls.find((call) =>
        !dismissedCallIds.includes(call.id) && pathname !== `/dashboard/meetings/${call.code}`
      );
      setIncomingCall(nextCall ?? null);
    } catch {
      // A missed poll should not dismiss a visible ringing call.
    }
  }, [dismissedCallIds, pathname]);

  useEffect(() => {
    queueMicrotask(() => void loadRequests());
    const interval = window.setInterval(loadRequests, 30_000);
    window.addEventListener("focus", loadRequests);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", loadRequests);
    };
  }, [loadRequests]);

  useEffect(() => {
    queueMicrotask(() => void loadCalls());
    const interval = window.setInterval(loadCalls, 3_000);
    window.addEventListener("focus", loadCalls);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", loadCalls);
    };
  }, [loadCalls]);

  const commands = useMemo(() => [
    { label: "Open home", keywords: "dashboard home", icon: LayoutGrid, href: "/dashboard" },
    { label: "Open messages", keywords: "chat direct group", icon: MessageCircle, href: "/dashboard/messages" },
    { label: "Open meetings", keywords: "video voice call room", icon: Video, href: "/dashboard/meetings" },
    { label: "Find people", keywords: "friends contacts", icon: Users, href: "/dashboard/friends" },
    { label: "Open settings", keywords: "profile theme status", icon: Settings, href: "/dashboard/settings" },
  ], []);

  const filteredCommands = commands.filter((command) =>
    `${command.label} ${command.keywords}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleRequest = async (friendshipId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const response = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });
      if (!response.ok) throw new Error(await response.text());
      setRequests((current) => current.filter((request) => request.friendshipId !== friendshipId));
      addToast(action === "ACCEPT" ? "Connection accepted" : "Request dismissed", "success");
      router.refresh();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not update request", "error");
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setDismissedCallIds((current) => [...current, call.id]);
    setIncomingCall(null);
    try {
      const response = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: call.code, status: "DECLINE_CALL" }),
      });
      if (!response.ok) throw new Error(await response.text());
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not decline the call", "error");
    }
  };

  const handleStatus = async (nextStatus: string) => {
    const previous = status;
    setStatus(nextStatus);
    setStatusOpen(false);
    try {
      const response = await fetch("/api/user/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setStatus(previous);
      addToast("Presence could not be updated", "error");
    }
  };

  const statusColor: Record<string, string> = {
    ONLINE: "bg-success",
    AWAY: "bg-amber-400",
    BUSY: "bg-rose-500",
    OFFLINE: "bg-text-muted",
  };

  return (
    <>
      <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-border-subtle bg-background/85 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            aria-label="Open navigation"
            className="grid h-9 w-9 place-items-center rounded-xl text-text-secondary hover:bg-sidebar-hover hover:text-text-primary md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-text-primary">{page.title}</h1>
            <p className="hidden truncate text-[10px] text-text-muted sm:block">{page.detail}</p>
          </div>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="group absolute left-1/2 hidden h-9 w-[min(36vw,420px)] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-border-subtle bg-bg-secondary/70 px-3 text-left text-[11px] text-text-muted transition-colors hover:border-border hover:bg-card lg:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Search workspace</span>
          <span className="flex items-center gap-1 rounded-md border border-border-subtle bg-background px-1.5 py-0.5 text-[9px] text-text-muted"><Command className="h-2.5 w-2.5" />K</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search workspace"
            className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-sidebar-hover hover:text-text-primary lg:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label="Connection requests"
              className="relative grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-sidebar-hover hover:text-text-primary"
            >
              <Bell className="h-4 w-4" />
              {requests.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-background bg-accent" />}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-[min(340px,calc(100vw-24px))] rounded-2xl border border-border bg-card p-3 shadow-2xl">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Connection requests</p>
                    <p className="mt-0.5 text-[9px] text-text-muted">People who want to connect with you</p>
                  </div>
                  <button onClick={() => setNotificationsOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg text-text-muted hover:bg-sidebar-hover hover:text-text-primary"><X className="h-3.5 w-3.5" /></button>
                </div>
                {requests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[10px] text-text-muted">You&apos;re all caught up.</div>
                ) : requests.map((request) => (
                  <div key={request.friendshipId} className="mb-1.5 flex items-center gap-3 rounded-xl bg-bg-secondary/75 p-2.5 last:mb-0">
                    <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-sidebar-hover text-xs font-semibold text-accent">
                      {request.requester.imageUrl ? <Image src={request.requester.imageUrl} alt="" fill className="object-cover" /> : request.requester.displayName?.slice(0, 1).toUpperCase() || "U"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-text-primary">{request.requester.displayName || request.requester.email || "Sync Space user"}</p>
                      <p className="text-[9px] text-text-muted">Wants to connect</p>
                    </div>
                    <button onClick={() => handleRequest(request.friendshipId, "ACCEPT")} className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleRequest(request.friendshipId, "DECLINE")} className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-hover text-text-muted hover:text-rose-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            suppressHydrationWarning
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle color theme"
            className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-sidebar-hover hover:text-text-primary"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <div className="relative ml-1 hidden sm:block">
            <button onClick={() => setStatusOpen((open) => !open)} className="flex h-9 items-center gap-2 rounded-xl border border-border-subtle bg-bg-secondary/70 px-2.5 text-[10px] font-medium text-text-secondary hover:border-border hover:text-text-primary">
              <span className={`h-2 w-2 rounded-full ${statusColor[status] ?? statusColor.OFFLINE}`} />
              <span className="capitalize">{status.toLowerCase()}</span>
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-12 w-40 rounded-xl border border-border bg-card p-1.5 shadow-2xl">
                {["ONLINE", "AWAY", "BUSY", "OFFLINE"].map((option) => (
                  <button key={option} onClick={() => handleStatus(option)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[10px] text-text-secondary hover:bg-sidebar-hover hover:text-text-primary">
                    <span className={`h-2 w-2 rounded-full ${statusColor[option]}`} />
                    <span className="flex-1 capitalize">{option.toLowerCase()}</span>
                    {option === status && <Check className="h-3 w-3 text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border-subtle px-4">
              <Search className="h-4 w-4 text-text-muted" />
              <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Where do you want to go?" className="h-14 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted" />
              <button onClick={() => setSearchOpen(false)} className="rounded-md border border-border px-1.5 py-1 text-[9px] text-text-muted">ESC</button>
            </div>
            <div className="p-2">
              {filteredCommands.map((command) => {
                const Icon = command.icon;
                return (
                  <button key={command.href} onClick={() => { router.push(command.href); setSearchOpen(false); setSearchQuery(""); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-text-secondary hover:bg-sidebar-hover hover:text-text-primary">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-bg-secondary text-text-muted"><Icon className="h-4 w-4" /></span>
                    {command.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {incomingCall && (
        <div className="fixed bottom-5 right-5 z-[70] w-[min(370px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-accent/25 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
          <div className="h-1 bg-accent" />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-accent/15 text-sm font-semibold text-accent">
                {incomingCall.createdBy.imageUrl ? <Image src={incomingCall.createdBy.imageUrl} alt="" fill className="object-cover" /> : incomingCall.createdBy.displayName?.slice(0, 1).toUpperCase() || "U"}
                <span className="absolute inset-0 rounded-2xl ring-2 ring-inset ring-accent/40" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-accent">Incoming {incomingCall.type === "VOICE" ? "voice" : "video"} call</p>
                <p className="mt-1 truncate text-sm font-semibold text-text-primary">{incomingCall.createdBy.displayName || "Sync Space user"}</p>
                <p className="text-[10px] text-text-muted">Join when you&apos;re ready</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={declineCall} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-500/10 text-xs font-semibold text-rose-400 hover:bg-rose-500/15"><PhoneOff className="h-4 w-4" />Decline</button>
              <button onClick={() => { router.push(`/dashboard/meetings/${incomingCall.code}`); setIncomingCall(null); }} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-xs font-semibold text-white hover:bg-accent-hover"><Phone className="h-4 w-4" />Join call</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

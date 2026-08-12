"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Settings,
  Users,
  Video,
  X,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface SidebarProps {
  user: {
    id: string;
    displayName: string | null;
    imageUrl: string | null;
    email: string;
    status: string;
  };
}

interface ConversationMember {
  userId: string;
  user: {
    id: string;
    displayName: string | null;
    imageUrl: string | null;
    status: string;
  };
}

interface ConversationSummary {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  unreadCount: number;
  members: ConversationMember[];
}

const primaryNavigation = [
  { label: "Home", href: "/dashboard", icon: LayoutGrid },
  { label: "Messages", href: "/dashboard/messages", icon: MessageCircle },
  { label: "Meetings", href: "/dashboard/meetings", icon: Video },
  { label: "People", href: "/dashboard/friends", icon: Users },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-[0_10px_26px_var(--accent-glow)]">
        <AudioLines className="h-4 w-4" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success" />
      </span>
      {!compact && (
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[-0.025em] text-text-primary">Sync Space</p>
          <p className="text-[9px] font-medium text-text-muted">Personal workspace</p>
        </div>
      )}
    </Link>
  );
}

function PresenceDot({ status }: { status: string }) {
  const color = {
    ONLINE: "bg-success",
    AWAY: "bg-amber-400",
    BUSY: "bg-rose-500",
    OFFLINE: "bg-text-muted",
  }[status] ?? "bg-text-muted";

  return <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar ${color}`} />;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    sidebarOpen,
    toggleSidebar,
  } = useUIStore();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const loadConversations = useCallback(async () => {
    if (document.visibilityState !== "visible") return;

    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      if (response.ok) setConversations(await response.json());
    } catch {
      // Keep the last known list during brief network interruptions.
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadConversations());

    // The dedicated message layout already refreshes conversations frequently.
    // Elsewhere, a slower cadence is enough for unread navigation badges.
    if (pathname.startsWith("/dashboard/messages")) return;

    const interval = window.setInterval(loadConversations, 15_000);
    const refresh = () => void loadConversations();
    window.addEventListener("focus", refresh);
    window.addEventListener("syncspace:conversations-changed", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("syncspace:conversations-changed", refresh);
    };
  }, [loadConversations, pathname]);

  const unreadTotal = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations]
  );

  const visibleConversations = conversations.slice(0, 7);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const renderContent = (compact: boolean, mobile = false) => (
    <>
      <div className={`flex h-[72px] shrink-0 items-center border-b border-border-subtle ${compact ? "justify-center px-2" : "justify-between px-4"}`}>
        <Brand compact={compact} />
        {!compact && (
          <button
            onClick={mobile ? toggleSidebar : toggleSidebarCollapse}
            aria-label={mobile ? "Close navigation" : "Collapse navigation"}
            className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-sidebar-hover hover:text-text-primary"
          >
            {mobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {compact && (
          <button
            onClick={toggleSidebarCollapse}
            aria-label="Expand navigation"
            className="mb-3 grid h-10 w-full place-items-center rounded-xl text-text-muted transition-colors hover:bg-sidebar-hover hover:text-text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <nav className="space-y-1" aria-label="Workspace">
          {primaryNavigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={mobile ? toggleSidebar : undefined}
                title={compact ? item.label : undefined}
                className={`group flex h-10 items-center rounded-xl transition-colors ${
                  compact ? "justify-center" : "gap-3 px-3"
                } ${active ? "bg-sidebar-active text-text-primary" : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"}`}
              >
                <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-accent" : "text-text-muted group-hover:text-text-secondary"}`} />
                {!compact && <span className="flex-1 text-[13px] font-medium">{item.label}</span>}
                {!compact && item.label === "Messages" && unreadTotal > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {!compact && visibleConversations.length > 0 && (
          <section className="mt-7">
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted">Recent</p>
              <Link href="/dashboard/messages" className="text-[9px] font-medium text-text-muted hover:text-text-primary">View all</Link>
            </div>
            <div className="space-y-0.5">
              {visibleConversations.map((conversation) => {
                const partner = conversation.members.find((member) => member.userId !== user.id)?.user;
                const name = conversation.type === "DIRECT"
                  ? partner?.displayName || "Unknown person"
                  : conversation.name || "Group conversation";
                const active = pathname === `/dashboard/messages/${conversation.id}`;

                return (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/messages/${conversation.id}`}
                    onClick={mobile ? toggleSidebar : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${active ? "bg-sidebar-active" : "hover:bg-sidebar-hover"}`}
                  >
                    <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-bg-secondary text-[10px] font-semibold text-text-secondary">
                      {partner?.imageUrl ? (
                        <Image src={partner.imageUrl} alt="" fill className="object-cover" />
                      ) : name.slice(0, 1).toUpperCase()}
                      {conversation.type === "DIRECT" && partner && <PresenceDot status={partner.status} />}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-[12px] ${active ? "font-semibold text-text-primary" : "font-medium text-text-secondary"}`}>{name}</span>
                    {conversation.unreadCount > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="shrink-0 border-t border-border-subtle p-3">
        <Link
          href="/dashboard/settings"
          onClick={mobile ? toggleSidebar : undefined}
          className={`mb-2 flex h-9 items-center rounded-xl text-text-muted transition-colors hover:bg-sidebar-hover hover:text-text-primary ${compact ? "justify-center" : "gap-3 px-2.5"}`}
        >
          <Settings className="h-4 w-4" />
          {!compact && <span className="text-[12px] font-medium">Settings</span>}
        </Link>

        <div className={`flex items-center rounded-xl bg-bg-secondary/60 p-2 ${compact ? "justify-center" : "gap-2.5"}`}>
          <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-sidebar-hover text-xs font-semibold text-accent">
            {user.imageUrl ? <Image src={user.imageUrl} alt="" fill className="object-cover" /> : user.displayName?.slice(0, 1).toUpperCase() || "U"}
            <PresenceDot status={user.status} />
          </span>
          {!compact && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-text-primary">{user.displayName || "User"}</p>
                <p className="truncate text-[9px] text-text-muted">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className={`relative z-30 hidden h-screen shrink-0 flex-col border-r border-border-subtle bg-sidebar transition-[width] duration-200 md:flex ${sidebarCollapsed ? "w-[72px]" : "w-[252px]"}`}>
        {renderContent(sidebarCollapsed)}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={toggleSidebar} aria-label="Close navigation" />
          <aside className="relative flex h-full w-[286px] flex-col border-r border-border bg-sidebar shadow-2xl">
            {renderContent(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}

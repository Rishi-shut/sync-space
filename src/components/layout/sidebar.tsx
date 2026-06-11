"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Video,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Users,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useUIStore } from "@/stores/ui-store";
import Image from "next/image";

interface SidebarProps {
  user: {
    id: string;
    displayName: string | null;
    imageUrl: string | null;
    email: string;
    status: string;
  };
}

const navItems = [
  { label: "Dashboard",  href: "/dashboard",           icon: LayoutDashboard },
  { label: "Messages",   href: "/dashboard/messages",  icon: MessageSquare   },
  { label: "Meetings",   href: "/dashboard/meetings",  icon: Video           },
  { label: "Friends",    href: "/dashboard/friends",   icon: Users           },
  { label: "Settings",   href: "/dashboard/settings",  icon: Settings        },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { signOut } = useClerk();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const [conversations, setConversations] = useState<any[]>([]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  useEffect(() => {
    const fetchConversations = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) setConversations(await res.json());
      } catch { /* ignore */ }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="hidden md:flex flex-col h-screen overflow-hidden select-none border-r border-border-subtle bg-sidebar relative z-20 flex-shrink-0"
    >
      {/* ── Brand ───────────────────────────────── */}
      <div className="h-[60px] px-4 flex items-center justify-between border-b border-border-subtle flex-shrink-0">
        {!sidebarCollapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent shadow-lg shadow-accent/20 flex-shrink-0">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-text-primary leading-none">
              Sync<span className="text-gradient">Space</span>
            </span>
          </Link>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-xl flex items-center justify-center bg-accent shadow-lg shadow-accent/20">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
        )}

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapse}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-sidebar-hover transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Nav Items ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapse}
            className="w-full flex justify-center py-2 mb-3 text-text-muted hover:text-text-secondary hover:bg-sidebar-hover rounded-lg transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[9px] transition-all duration-150 group ${
                isActive
                  ? "bg-sidebar-active text-accent font-semibold"
                  : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
              } ${sidebarCollapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-all ${
                  isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                }`}
              />
              {!sidebarCollapsed && (
                <span className="text-[13.5px] flex-1 truncate">{item.label}</span>
              )}
              {!sidebarCollapsed && item.label === "Messages" && conversations.length > 0 && (
                <span className="badge text-[10px]">{conversations.length}</span>
              )}
            </Link>
          );
        })}

        {/* ── DM List ─────────────────────────── */}
        {!sidebarCollapsed && conversations.length > 0 && (
          <div className="pt-5 mt-2 border-t border-border-subtle">
            <p className="px-3 mb-2 section-label">Direct Messages</p>
            <div className="space-y-0.5">
              {conversations.map((convo) => {
                const isDirect = convo.type === "DIRECT";
                const partner = convo.members.find((m: any) => m.userId !== user.id)?.user;
                const displayName = isDirect ? partner?.displayName || "User" : convo.name || "Group";
                const status = isDirect ? partner?.status?.toLowerCase() : null;
                const initials = displayName[0]?.toUpperCase() || "U";
                const isActive = pathname === `/dashboard/messages/${convo.id}`;

                return (
                  <Link
                    key={convo.id}
                    href={`/dashboard/messages/${convo.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-[9px] transition-all text-[13px] ${
                      isActive
                        ? "bg-sidebar-active text-accent font-semibold"
                        : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded-lg bg-sidebar-hover flex items-center justify-center text-[10px] font-bold text-accent border border-border-subtle">
                        {initials}
                      </div>
                      {status && (
                        <div
                          className={`avatar-status ${status}`}
                          style={{ width: "7px", height: "7px", border: "1.5px solid var(--sidebar-bg)" }}
                        />
                      )}
                    </div>
                    <span className="truncate">{displayName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── User Footer ─────────────────────────── */}
      <div className="border-t border-border-subtle p-3 flex-shrink-0">
        <div className={`flex items-center gap-2.5 ${sidebarCollapsed ? "justify-center" : ""}`}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-border-subtle">
              {user.imageUrl ? (
                <Image src={user.imageUrl} alt={user.displayName || "User"} width={32} height={32} className="object-cover" />
              ) : (
                <div className="w-full h-full bg-sidebar-hover flex items-center justify-center text-[12px] font-bold text-accent">
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div
              className="avatar-status online"
              style={{ width: "9px", height: "9px", border: "2px solid var(--sidebar-bg)" }}
            />
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">
                  {user.displayName || "User"}
                </p>
                <p className="text-[10px] text-text-muted truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

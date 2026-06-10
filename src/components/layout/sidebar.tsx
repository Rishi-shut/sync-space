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
  Power,
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

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const [conversations, setConversations] = useState<any[]>([]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: String(conversations.length || "") },
    { label: "Meetings", href: "/dashboard/meetings", icon: Video },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (err) {
        console.error("Failed to fetch sidebar conversations:", err);
      }
    };
    fetchConversations();
    // Poll every 10 seconds to keep sidebar conversations updated
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen overflow-hidden select-none border-r border-border bg-sidebar relative z-20"
    >
      {/* Top Brand Logo */}
      <div className="p-6 flex items-center justify-between border-b border-border h-20">
        {!sidebarCollapsed ? (
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent"
              >
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-sm font-bold tracking-tight text-text-primary">
              Sync<span className="text-gradient">Space</span>
            </span>
          </Link>
        ) : (
          <div className="mx-auto">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Collapse button */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapse}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapse}
            className="w-10 h-10 mx-auto mb-4 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-sidebar-hover transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? "active font-semibold bg-sidebar-active text-accent" : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm flex-1">{item.label}</span>
            )}
            {!sidebarCollapsed && item.badge && item.badge !== "0" && (
              <span className="badge ml-auto">{item.badge}</span>
            )}
          </Link>
        );
      })}

      {/* DMs Section header */}
      {!sidebarCollapsed && (
        <div className="mt-8 pt-4 border-t border-border">
          <p className="px-3 text-xs font-semibold tracking-wider text-text-muted uppercase mb-3">
            Direct Messages
          </p>
          <div className="space-y-1">
            {conversations.map((convo) => {
              const isDirect = convo.type === "DIRECT";
              const partnerMember = convo.members.find((m: any) => m.userId !== user.id);
              const partner = partnerMember?.user;
              const displayName = isDirect ? partner?.displayName || "User" : convo.name || "Group Chat";
              const status = isDirect ? partner?.status || "OFFLINE" : null;
              const initials = displayName[0]?.toUpperCase() || "U";

              return (
                <Link
                  key={convo.id}
                  href={`/dashboard/messages/${convo.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                    pathname === `/dashboard/messages/${convo.id}`
                      ? "bg-sidebar-active text-accent font-semibold"
                      : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-sidebar-hover"
                      style={{ color: "var(--accent)" }}
                    >
                      {initials}
                    </div>
                    {status && (
                      <div className={`avatar-status ${status.toLowerCase()}`} style={{ width: "8px", height: "8px", border: "1.5px solid var(--sidebar-bg)" }} />
                    )}
                  </div>
                  <span className="truncate">{displayName}</span>
                </Link>
              );
            })}
            {conversations.length === 0 && (
              <p className="px-3 text-[10px] text-text-muted italic">No active conversations</p>
            )}
          </div>
        </div>
      )}
    </div>

    {/* User profile footer info */}
    <div className="p-4 border-t border-border bg-sidebar/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-border">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="User profile"
                  width={36}
                  height={36}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-sidebar-hover flex items-center justify-center text-sm font-bold text-accent">
                  {user.displayName?.[0] || "U"}
                </div>
              )}
            </div>
            <div className="avatar-status online" style={{ border: "2px solid var(--sidebar-bg)" }} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {user.email}
              </p>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <Power className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </motion.aside>
);
}

"use client";

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

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: "3" },
    { label: "Meetings", href: "/dashboard/meetings", icon: Video },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen overflow-hidden select-none border-r border-[#1e2235] bg-[#0a0c14] relative z-20"
    >
      {/* Top Brand Logo */}
      <div className={`p-6 flex items-center justify-between border-b border-[#1e2235]/40 h-20`}>
        {!sidebarCollapsed ? (
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--gradient-accent)" }}
              >
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-accent" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Sync<span className="text-gradient">Space</span>
            </span>
          </Link>
        ) : (
          <div className="mx-auto">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-accent)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Collapse button */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapse}
            className="p-1 rounded-md text-[#8b8fa3] hover:text-white hover:bg-[#161925] transition-colors"
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
            className="w-10 h-10 mx-auto mb-4 rounded-lg flex items-center justify-center text-[#8b8fa3] hover:text-white hover:bg-[#161925] transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? "active font-semibold bg-[rgba(124,92,252,0.12)] text-accent" : "text-[#8b8fa3] hover:bg-[#13152080] hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm flex-1">{item.label}</span>
              )}
              {!sidebarCollapsed && item.badge && (
                <span className="badge ml-auto">{item.badge}</span>
              )}
            </Link>
          );
        })}

        {/* DMs Section header */}
        {!sidebarCollapsed && (
          <div className="mt-8 pt-4 border-t border-[#1e2235]/40">
            <p className="px-3 text-xs font-semibold tracking-wider text-[#565b73] uppercase mb-3">
              Direct Messages
            </p>
            <div className="space-y-1">
              {[
                { name: "Alex Chen", avatar: "A", status: "online" },
                { name: "Sarah Kim", avatar: "S", status: "away" },
                { name: "Team Design", avatar: "T", status: "busy", isGroup: true },
              ].map((dm) => (
                <div
                  key={dm.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#8b8fa3] hover:bg-[#13152080] hover:text-white cursor-pointer transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-[#161925]"
                      style={{ color: "var(--accent)" }}
                    >
                      {dm.avatar}
                    </div>
                    <div className={`avatar-status ${dm.status}`} style={{ width: "8px", height: "8px", border: "1.5px solid var(--sidebar-bg)" }} />
                  </div>
                  <span className="truncate">{dm.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User profile footer info */}
      <div className="p-4 border-t border-[#1e2235]/40 bg-[#07080d]/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#1e2235]">
                {user.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="User profile"
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#161925] flex items-center justify-center text-sm font-bold text-accent">
                    {user.displayName?.[0] || "U"}
                  </div>
                )}
              </div>
              <div className="avatar-status online" style={{ border: "2px solid #07080d" }} />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-[#8b8fa3] truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-[#8b8fa3] hover:text-red-400 hover:bg-red-500/10 transition-colors"
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

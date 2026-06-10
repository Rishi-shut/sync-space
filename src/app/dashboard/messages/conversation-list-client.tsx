"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, Plus, UserPlus, X, MessageSquare, Bot } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
  status: string;
  email: string;
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

interface Message {
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  name: string | null;
  type: string;
  members: ConversationMember[];
  messages: Message[];
}

interface ConversationListClientProps {
  userId: string;
}

export default function ConversationListClient({ userId }: ConversationListClientProps) {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.id as string;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all user conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch potential chat partners when opening modal
  const openNewChatModal = async () => {
    setIsModalOpen(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handleStartChat = async (partnerId: string) => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DIRECT", partnerId }),
      });

      if (res.ok) {
        const convo = await res.json();
        setIsModalOpen(false);
        fetchConversations();
        router.push(`/dashboard/messages/${convo.id}`);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Helper to extract DM partner info
  const getDMPartner = (convo: Conversation) => {
    const partnerMember = convo.members.find((m) => m.userId !== userId);
    return partnerMember?.user;
  };

  const statusColors: Record<string, string> = {
    ONLINE: "bg-emerald-500",
    AWAY: "bg-amber-500",
    BUSY: "bg-rose-500",
    OFFLINE: "bg-slate-500",
  };

  // Filter conversations
  const filteredConversations = conversations.filter((convo) => {
    if (convo.type === "DIRECT") {
      const partner = getDMPartner(convo);
      return partner?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    }
    return convo.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  return (
    <div className="w-80 h-full border-r border-border bg-background flex flex-col relative z-10 select-none">
      {/* Header with Search and New Chat button */}
      <div className="p-4 space-y-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Chats
          </h2>
          <button
            onClick={openNewChatModal}
            className="p-1.5 rounded-lg border border-border bg-card text-text-secondary hover:text-text-primary hover:bg-card-hover transition-all"
            title="New Direct Message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card/30 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-card-hover/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-card-hover/60 rounded w-2/3" />
                  <div className="h-2 bg-card-hover/40 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((convo) => {
            const isDirect = convo.type === "DIRECT";
            const displayName = isDirect ? getDMPartner(convo)?.displayName || "User" : convo.name || "Group Chat";
            const imageUrl = isDirect ? getDMPartner(convo)?.imageUrl : null;
            const status = isDirect ? getDMPartner(convo)?.status || "OFFLINE" : null;
            const lastMessage = convo.messages[0]?.content || "No messages yet";
            const isActive = activeId === convo.id;

            return (
              <button
                key={convo.id}
                onClick={() => router.push(`/dashboard/messages/${convo.id}`)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isActive ? "bg-sidebar-active text-text-primary border border-border" : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-border relative">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={displayName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-card-hover flex items-center justify-center text-xs font-bold text-accent">
                        {displayName[0]}
                      </div>
                    )}
                  </div>
                  {status && (
                    <div className={`avatar-status ${status.toLowerCase()}`} style={{ border: "2px solid var(--sidebar-bg)", bottom: -2, right: -2 }} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate text-text-primary">{displayName}</span>
                  </div>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    {lastMessage}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-12 text-text-muted">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No active chats</p>
            <p className="text-[10px] mt-1 px-4">Click the plus icon above to start a new chat.</p>
          </div>
        )}
      </div>

      {/* New DM Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black z-30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute left-4 right-4 bottom-4 top-20 md:top-auto md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:w-96 rounded-2xl border border-border bg-card p-6 shadow-2xl z-40 flex flex-col max-h-[400px]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">New Direct Message</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-card-hover text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                {users.length > 0 ? (
                  users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleStartChat(user.id)}
                      disabled={isCreating}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-card-hover transition-all text-left group"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-border relative">
                          {user.imageUrl ? (
                            <Image src={user.imageUrl} alt={user.displayName || ""} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-card-hover flex items-center justify-center text-xs font-bold text-accent">
                              {user.displayName?.[0] || "U"}
                            </div>
                          )}
                        </div>
                        <div className={`avatar-status ${user.status.toLowerCase()}`} style={{ border: "2px solid var(--card)", width: "8px", height: "8px" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <p className="text-xs">No other users found</p>
                    <p className="text-[10px] mt-1">Invite colleagues to your space to start syncing.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

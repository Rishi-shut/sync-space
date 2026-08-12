"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNowStrict } from "date-fns";
import { MessageSquare, Plus, Search, UserPlus, X } from "lucide-react";

interface User {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
  status: string;
  email: string;
}

interface ConversationMember {
  userId: string;
  user: Omit<User, "email">;
}

interface Conversation {
  id: string;
  name: string | null;
  type: string;
  members: ConversationMember[];
  messages: Array<{ content: string; createdAt: string }>;
  unreadCount?: number;
}

interface ConversationListClientProps {
  userId: string;
}

export default function ConversationListClient({ userId }: ConversationListClientProps) {
  const router = useRouter();
  const params = useParams();
  const activeId = typeof params?.id === "string" ? params.id : undefined;
  const requestInFlight = useRef(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (requestInFlight.current || document.visibilityState !== "visible") return;
      requestInFlight.current = true;
      try {
        const response = await fetch("/api/conversations", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not refresh conversations");
        const data = (await response.json()) as Conversation[];
        if (active) setConversations(data);
      } catch (refreshError) {
        console.error("Failed to load conversations:", refreshError);
      } finally {
        requestInFlight.current = false;
        if (active) setIsLoading(false);
      }
    };

    queueMicrotask(refresh);
    const interval = window.setInterval(refresh, 4000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("syncspace:conversations-changed", refresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("syncspace:conversations-changed", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const getPartner = (conversation: Conversation) =>
    conversation.members.find((member) => member.userId !== userId)?.user;

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const label = conversation.type === "DIRECT"
        ? conversation.members.find((member) => member.userId !== userId)?.user.displayName
        : conversation.name;
      return label?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, userId]);

  const openNewChatModal = async () => {
    setIsModalOpen(true);
    setIsLoadingUsers(true);
    setError(null);
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load people");
      setUsers((await response.json()) as User[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load people");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleStartChat = async (partnerId: string) => {
    setCreatingUserId(partnerId);
    setError(null);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DIRECT", partnerId }),
      });
      if (!response.ok) throw new Error("Could not start this conversation");
      const conversation = (await response.json()) as { id: string };
      setIsModalOpen(false);
      window.dispatchEvent(new Event("syncspace:conversations-changed"));
      router.push(`/dashboard/messages/${conversation.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not start this conversation");
    } finally {
      setCreatingUserId(null);
    }
  };

  return (
    <aside className={`${activeId ? "hidden md:flex" : "flex"} h-full w-full shrink-0 flex-col border-r border-border bg-bg-secondary/45 md:w-[326px]`}>
      <div className="border-b border-border px-4 pb-4 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">Messages</p>
            <h2 className="mt-1 text-lg font-semibold text-text-primary">Conversations</h2>
          </div>
          <button type="button" onClick={openNewChatModal} className="grid size-9 place-items-center rounded-xl bg-accent text-white transition hover:bg-accent-hover" aria-label="Start a conversation">
            <Plus className="size-4" />
          </button>
        </div>
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search conversations" className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent/60" />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {isLoading ? (
          <div className="space-y-1.5">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-xl bg-card/70" />)}
          </div>
        ) : filteredConversations.length ? (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const partner = conversation.type === "DIRECT" ? getPartner(conversation) : null;
              const displayName = partner?.displayName ?? conversation.name ?? "Group conversation";
              const lastMessage = conversation.messages[0];
              const unread = conversation.unreadCount ?? 0;
              const isActive = activeId === conversation.id;
              return (
                <button key={conversation.id} type="button" onClick={() => router.push(`/dashboard/messages/${conversation.id}`)} className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${isActive ? "border-accent/25 bg-accent/10" : "border-transparent hover:border-border hover:bg-card"}`}>
                  <div className="relative size-10 shrink-0 overflow-visible">
                    <div className="relative size-10 overflow-hidden rounded-xl border border-border bg-card-hover">
                      {partner?.imageUrl ? <Image src={partner.imageUrl} alt="" fill className="object-cover" /> : <div className="grid size-full place-items-center text-sm font-semibold text-accent">{displayName.charAt(0).toUpperCase()}</div>}
                    </div>
                    {partner && <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-bg-secondary ${partner.status === "ONLINE" ? "bg-success" : partner.status === "AWAY" ? "bg-amber-400" : partner.status === "BUSY" ? "bg-rose-400" : "bg-text-muted"}`} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{displayName}</p>
                      {lastMessage && <span suppressHydrationWarning className="shrink-0 text-[10px] text-text-muted">{formatDistanceToNowStrict(new Date(lastMessage.createdAt))}</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className={`min-w-0 flex-1 truncate text-xs ${unread ? "font-medium text-text-primary" : "text-text-muted"}`}>{lastMessage?.content || "Start the conversation"}</p>
                      {unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread > 99 ? "99+" : unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid h-full min-h-64 place-items-center px-6 text-center">
            <div><div className="mx-auto grid size-11 place-items-center rounded-2xl bg-card text-text-muted"><MessageSquare className="size-5" /></div><p className="mt-3 text-sm font-medium text-text-primary">{searchQuery ? "No matching conversations" : "Your inbox is quiet"}</p><p className="mt-1 text-xs leading-5 text-text-muted">{searchQuery ? "Try a different name." : "Start a conversation with someone in your space."}</p></div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setIsModalOpen(false)}>
          <section className="flex max-h-[560px] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-accent/12 text-accent"><UserPlus className="size-4" /></div><div><h3 className="text-sm font-semibold text-text-primary">Start a conversation</h3><p className="text-xs text-text-muted">Choose someone in your space</p></div></div><button type="button" onClick={() => setIsModalOpen(false)} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-card-hover hover:text-text-primary" aria-label="Close"><X className="size-4" /></button></header>
            <div className="overflow-y-auto p-2.5">
              {error && <p className="m-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
              {isLoadingUsers ? <div className="space-y-2 p-2">{[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-card-hover" />)}</div> : users.length ? users.map((user) => <button key={user.id} type="button" disabled={creatingUserId !== null} onClick={() => handleStartChat(user.id)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-card-hover disabled:opacity-60"><div className="relative size-9 overflow-hidden rounded-xl border border-border bg-bg-secondary">{user.imageUrl ? <Image src={user.imageUrl} alt="" fill className="object-cover" /> : <div className="grid size-full place-items-center text-xs font-semibold text-accent">{user.displayName?.charAt(0).toUpperCase() || "U"}</div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text-primary">{user.displayName || "Unnamed user"}</p><p className="truncate text-xs text-text-muted">{user.email}</p></div>{creatingUserId === user.id && <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />}</button>) : <p className="px-4 py-12 text-center text-sm text-text-muted">No other users are available yet.</p>}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

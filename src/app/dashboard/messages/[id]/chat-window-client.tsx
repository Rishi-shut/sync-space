"use client";

import { useEffect, useRef, useState } from "react";
import { Send, User as UserIcon, Trash2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserInfo {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
  status: string;
}

interface MemberInfo {
  userId: string;
  user: UserInfo;
}

interface ConversationInfo {
  id: string;
  type: string;
  name: string | null;
  members: MemberInfo[];
}

interface MessageSender {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: MessageSender;
}

interface ChatWindowClientProps {
  userId: string;
  conversation: ConversationInfo;
  initialMessages: Message[];
}

export default function ChatWindowClient({
  userId,
  conversation,
  initialMessages,
}: ChatWindowClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleDeleteChat = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this chat and all its messages? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/messages");
        router.refresh();
      } else {
        alert("Failed to delete the chat.");
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-scroll to bottom of page
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new messages every 3 seconds
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
          signal: controller.signal,
        });
        if (res.ok && active) {
          const data = await res.json();
          // Merge / replace history
          setMessages(data.items);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error polling messages:", err);
        }
      }
    };

    const interval = setInterval(poll, 3000);

    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [conversation.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    const textToSend = content;
    setContent("");

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textToSend }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const isDirect = conversation.type === "DIRECT";
  const partner = isDirect
    ? conversation.members.find((m) => m.userId !== userId)?.user
    : null;
  const displayName = isDirect ? partner?.displayName || "User" : conversation.name || "Group Chat";

  return (
    <div className="flex flex-col h-full bg-background select-none">
      {/* Top Header Panel */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/messages"
            className="md:hidden p-1.5 rounded-lg border border-border bg-card text-text-secondary hover:text-text-primary hover:bg-card-hover transition-colors mr-1 flex items-center justify-center animate-fadeIn"
            title="Back to Chats"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="relative">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border relative">
              {isDirect && partner?.imageUrl ? (
                <Image
                  src={partner.imageUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-background flex items-center justify-center text-xs font-bold text-accent">
                  {displayName[0]}
                </div>
              )}
            </div>
            {isDirect && partner?.status && (
              <div
                className={`avatar-status ${partner.status.toLowerCase()}`}
                style={{
                  width: "8px",
                  height: "8px",
                  border: "1.5px solid var(--card)",
                  bottom: -1,
                  right: -1,
                }}
              />
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground">{displayName}</h3>
            {isDirect && partner?.status && (
              <span className="text-[9px] text-text-secondary capitalize">
                {partner.status.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDeleteChat}
          disabled={isDeleting}
          className="p-2 rounded-lg border border-border bg-card text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer flex items-center justify-center"
          title="Delete Chat"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-rose-500 rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Messages Feed Frame */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === userId;
          const timeLabel = mounted
            ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })
            : "";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${isOwn ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Sender Avatar */}
              {!isOwn && (
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-border relative flex-shrink-0 mt-1">
                  {msg.sender.imageUrl ? (
                    <Image
                      src={msg.sender.imageUrl}
                      alt={msg.sender.displayName || ""}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-background flex items-center justify-center text-[10px] font-bold text-accent">
                      {msg.sender.displayName?.[0] || "U"}
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div className="space-y-1">
                {!isOwn && (
                  <span className="text-[10px] font-medium text-text-secondary block px-1">
                    {msg.sender.displayName || "User"}
                  </span>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed break-words ${
                    isOwn
                      ? "bg-accent text-white rounded-tr-none"
                      : "bg-card border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[8px] text-text-secondary block px-1 text-right">
                  {timeLabel}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Text Message Input Panel */}
      <form onSubmit={handleSend} className="p-4 bg-card border-t border-border flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 input bg-background border-border text-xs py-2 text-foreground"
          required
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

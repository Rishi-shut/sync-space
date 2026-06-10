"use client";

import { useEffect, useRef, useState } from "react";
import { Send, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of page
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversation.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          // Merge / replace history
          setMessages(data.items);
        }
      } catch (err) {
        console.error("Error polling messages:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
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
    <div className="flex flex-col h-full bg-[#0c0c0e] select-none">
      {/* Top Header Panel */}
      <div className="h-16 px-6 border-b border-[#1f1f23]/60 flex items-center justify-between bg-[#09090b]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#27272a] relative">
              {isDirect && partner?.imageUrl ? (
                <Image
                  src={partner.imageUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-xs font-bold text-accent">
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
                  border: "1.5px solid #09090b",
                  bottom: -1,
                  right: -1,
                }}
              />
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">{displayName}</h3>
            {isDirect && partner?.status && (
              <span className="text-[9px] text-[#52525b] capitalize">
                {partner.status.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Feed Frame */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === userId;
          const timeLabel = formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true });

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${isOwn ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Sender Avatar */}
              {!isOwn && (
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#27272a] relative flex-shrink-0 mt-1">
                  {msg.sender.imageUrl ? (
                    <Image
                      src={msg.sender.imageUrl}
                      alt={msg.sender.displayName || ""}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-[10px] font-bold text-accent">
                      {msg.sender.displayName?.[0] || "U"}
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div className="space-y-1">
                {!isOwn && (
                  <span className="text-[10px] font-medium text-[#a1a1aa] block px-1">
                    {msg.sender.displayName || "User"}
                  </span>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed break-words ${
                    isOwn
                      ? "bg-accent text-white rounded-tr-none"
                      : "bg-[#18181b] border border-[#27272a] text-white rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[8px] text-[#52525b] block px-1 text-right">
                  {timeLabel}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Text Message Input Panel */}
      <form onSubmit={handleSend} className="p-4 bg-[#09090b] border-t border-[#1f1f23]/60 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 input bg-[#0c0c0e] border-[#27272a] text-xs py-2 text-white"
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

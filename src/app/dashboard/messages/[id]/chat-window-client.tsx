"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2, ArrowLeft, Video, Phone, Paperclip, X, File, AlertCircle } from "lucide-react";
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

interface AttachmentInfo {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: MessageSender;
  attachments?: AttachmentInfo[];
  deliveryStatus?: "sending" | "failed";
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollInFlightRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const latestServerTimestampRef = useRef(
    initialMessages.at(-1)?.createdAt ?? null
  );
  const latestIncomingMessageId = [...messages]
    .reverse()
    .find((message) => message.senderId !== userId && !message.deliveryStatus)?.id;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || "Upload failed");
      }

      const attachment = await res.json();
      setAttachments((prev) => [...prev, attachment]);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartCall = async () => {
    if (!partner) return;
    setIsCalling(true);
    try {
      // 1. Create Direct Video Call Meeting
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: `Call with ${displayName}`,
          type: "VIDEO",
          conversationId: conversation.id,
          recipientId: partner.id
        }),
      });

      if (!meetingRes.ok) throw new Error("Could not initialize video call");
      const meeting = await meetingRes.json();

      // 2. Redirect host directly into the call room
      router.push(`/dashboard/meetings/${meeting.code}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to start call");
    } finally {
      setIsCalling(false);
    }
  };

  const handleStartVoiceCall = async () => {
    if (!partner) return;
    setIsCalling(true);
    try {
      // 1. Create Direct Voice Call Meeting
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: `Voice Call with ${displayName}`,
          type: "VOICE",
          conversationId: conversation.id,
          recipientId: partner.id
        }),
      });

      if (!meetingRes.ok) throw new Error("Could not initialize voice call");
      const meeting = await meetingRes.json();

      // 2. Redirect host directly into the call room
      router.push(`/dashboard/meetings/${meeting.code}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to start voice call");
    } finally {
      setIsCalling(false);
    }
  };

  const handleDeleteChat = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.dispatchEvent(new Event("syncspace:conversations-changed"));
        router.replace("/dashboard/messages");
        router.refresh();
      } else {
        setFeedback("Failed to delete the conversation.");
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      setFeedback("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Mark conversation as read
  useEffect(() => {
    const controller = new AbortController();
    const markAsRead = async () => {
      try {
        await fetch(`/api/conversations/${conversation.id}`, {
          method: "PATCH",
          signal: controller.signal,
        });
        window.dispatchEvent(new Event("syncspace:conversations-changed"));
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Failed to mark conversation as read:", err);
        }
      }
    };
    const timeout = window.setTimeout(markAsRead, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [conversation.id, latestIncomingMessageId]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    if (!didInitialScrollRef.current || distanceFromBottom < 220) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: didInitialScrollRef.current ? "smooth" : "instant",
      });
    }
    didInitialScrollRef.current = true;
  }, [messages]);

  // Fetch only messages newer than the latest server message. Own messages are
  // inserted optimistically, so sending feels instant while this keeps peers in sync.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const poll = async () => {
      if (pollInFlightRef.current || document.visibilityState !== "visible") {
        return;
      }
      pollInFlightRef.current = true;
      try {
        const after = latestServerTimestampRef.current;
        const query = after ? `?after=${encodeURIComponent(after)}` : "";
        const res = await fetch(`/api/conversations/${conversation.id}/messages${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (res.ok && active) {
          const data = await res.json();
          setMessages((current) => {
            const merged = new Map(current.map((message) => [message.id, message]));
            data.items.forEach((message: Message) => merged.set(message.id, message));
            return Array.from(merged.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });

          const newest = data.items.at(-1) as Message | undefined;
          if (newest) latestServerTimestampRef.current = newest.createdAt;
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Error polling messages:", error);
        }
      } finally {
        pollInFlightRef.current = false;
      }
    };

    void poll();
    const interval = setInterval(poll, 800);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void poll();
    };
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      controller.abort();
      pollInFlightRef.current = false;
      clearInterval(interval);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [conversation.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || isUploading) return;

    const textToSend = content;
    const attachmentsToSend = attachments;
    setContent("");
    setAttachments([]);
    setFeedback(null);

    let type = "TEXT";
    if (attachmentsToSend.length > 0) {
      const firstAttachment = attachmentsToSend[0];
      if (firstAttachment.mimeType.startsWith("image/")) {
        type = "IMAGE";
      } else {
        type = "FILE";
      }
    }

    const currentUser = conversation.members.find((member) => member.userId === userId)?.user;
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content: textToSend,
      senderId: userId,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        displayName: currentUser?.displayName ?? "You",
        imageUrl: currentUser?.imageUrl ?? null,
      },
      attachments: attachmentsToSend,
      deliveryStatus: "sending",
    };

    setMessages((current) => [...current, optimisticMessage]);

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToSend,
          type,
          attachments: attachmentsToSend,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const newMessage = await res.json();
      latestServerTimestampRef.current = newMessage.createdAt;
      setMessages((current) => {
        const withoutDuplicates = current.filter(
          (message) => message.id !== optimisticId && message.id !== newMessage.id
        );
        return [...withoutDuplicates, newMessage].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      window.dispatchEvent(new Event("syncspace:conversations-changed"));
    } catch (error) {
      console.error("Failed to send message:", error);
      setFeedback("Message not sent. Check your connection and try again.");
      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticId
            ? { ...message, deliveryStatus: "failed" }
            : message
        )
      );
    }
  };

  const isDirect = conversation.type === "DIRECT";
  const partner = isDirect
    ? conversation.members.find((m) => m.userId !== userId)?.user
    : null;
  const displayName = isDirect ? partner?.displayName || "User" : conversation.name || "Group Chat";

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Top Header Panel */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
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

        <div className="flex items-center gap-2">
          {isDirect && (
            <>
              <button
                onClick={handleStartVoiceCall}
                disabled={isCalling}
                className="p-2 rounded-lg border border-border bg-card text-accent hover:bg-accent/10 hover:text-accent transition-all cursor-pointer flex items-center justify-center"
                title="Voice Call"
              >
                {isCalling ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-accent rounded-full animate-spin" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleStartCall}
                disabled={isCalling}
                className="p-2 rounded-lg border border-border bg-card text-accent hover:bg-accent/10 hover:text-accent transition-all cursor-pointer flex items-center justify-center"
                title="Start Video Call"
              >
                {isCalling ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-accent rounded-full animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </button>
            </>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
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
      </div>

      {/* Messages Feed Frame */}
      <div ref={messagesViewportRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === userId;
          const timeLabel = formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true });

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${isOwn ? "ml-auto flex-row-reverse" : "mr-auto"} ${msg.deliveryStatus === "sending" ? "opacity-70" : ""}`}
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
                {msg.content && (
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed break-words ${
                      isOwn
                        ? "bg-accent text-white rounded-tr-none"
                        : "bg-card border border-border text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-2 mt-1">
                    {msg.attachments.map((att) => {
                      const isImage = att.mimeType.startsWith("image/");
                      if (isImage) {
                        return (
                          <div
                            key={att.id}
                            className="rounded-xl overflow-hidden border border-border max-w-sm relative aspect-video cursor-pointer bg-card group"
                            onClick={() => window.open(att.url, "_blank")}
                          >
                            <Image
                              src={att.url}
                              alt={att.name}
                              fill
                              className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
                              unoptimized
                            />
                          </div>
                        );
                      } else {
                        return (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer max-w-sm ${
                              isOwn
                                ? "bg-accent/15 border-accent/25 hover:bg-accent/25 text-white"
                                : "bg-card border-border hover:bg-card-hover text-text-primary"
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-background/80 flex items-center justify-center">
                              <File className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs font-semibold truncate">{att.name}</p>
                              <p className="text-[10px] opacity-70">{(att.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </a>
                        );
                      }
                    })}
                  </div>
                )}
                <span suppressHydrationWarning className="text-[8px] text-text-secondary block px-1 text-right">
                  {msg.deliveryStatus === "sending"
                    ? "Sending…"
                    : msg.deliveryStatus === "failed"
                      ? "Not sent"
                      : timeLabel}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Text Message Input Panel */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-border bg-background px-4 pb-4 pt-3 md:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
        {feedback && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            <span className="flex items-center gap-2"><AlertCircle className="size-3.5 shrink-0" />{feedback}</span>
            <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss"><X className="size-3.5" /></button>
          </div>
        )}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fadeIn">
            {attachments.map((att, index) => {
              const isImage = att.mimeType.startsWith("image/");
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-background relative group"
                >
                  {isImage ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-border">
                      <Image src={att.url} alt={att.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="p-1 rounded bg-accent/10">
                      <File className="w-6 h-6 text-accent" />
                    </div>
                  )}
                  <div className="max-w-[120px] text-left">
                    <p className="text-[10px] font-semibold truncate text-text-primary">{att.name}</p>
                    <p className="text-[8px] text-text-secondary">{(att.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="p-1 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-accent/50">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 rounded-lg border border-border bg-card text-accent hover:bg-accent/10 hover:text-accent transition-all cursor-pointer flex items-center justify-center"
            title="Attach file or picture"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-accent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isUploading ? "Uploading file..." : "Type your message..."}
            disabled={isUploading}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={isUploading || (!content.trim() && attachments.length === 0)}
            className="btn-primary gap-1.5 px-4 py-2.5 text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
        </div>
      </form>

      {/* Delete Chat Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="bg-[#14141b] border border-[#24242e] rounded-2xl p-6 max-w-sm w-full relative z-10 space-y-4 animate-scaleIn shadow-2xl">
            <h3 className="text-sm font-bold text-white">Delete Chat?</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Are you sure you want to permanently delete this chat and all its messages? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteChat();
                }}
                className="flex-1 btn-primary bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold rounded-xl text-white cursor-pointer justify-center animate-none"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary bg-[#0f0f13] hover:bg-[#1b1b24] py-2.5 text-xs font-semibold rounded-xl border border-[#24242e] text-[#fafafa] cursor-pointer justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

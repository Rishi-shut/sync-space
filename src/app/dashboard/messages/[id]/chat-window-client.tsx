"use client";

import { useEffect, useRef, useState } from "react";
import { Send, User as UserIcon, Trash2, ArrowLeft, Video, Phone, Paperclip, X, File } from "lucide-react";
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
  const [isCalling, setIsCalling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
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
    } catch (err: any) {
      alert(err.message || "Failed to start call");
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
    } catch (err: any) {
      alert(err.message || "Failed to start voice call");
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
        window.location.href = "/dashboard/messages";
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
    if ((!content.trim() && attachments.length === 0) || isSending || isUploading) return;

    setIsSending(true);
    const textToSend = content;
    const attachmentsToSend = attachments;
    setContent("");
    setAttachments([]);

    let type = "TEXT";
    if (attachmentsToSend.length > 0) {
      const firstAttachment = attachmentsToSend[0];
      if (firstAttachment.mimeType.startsWith("image/")) {
        type = "IMAGE";
      } else {
        type = "FILE";
      }
    }

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
    <div className="flex flex-col w-full h-full bg-background select-none">
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
      <form onSubmit={handleSend} className="p-4 bg-card border-t border-border flex flex-col gap-3">
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

        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
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
            className="flex-1 input bg-background border-border text-xs py-2 text-foreground"
          />
          <button
            type="submit"
            disabled={isSending || isUploading || (!content.trim() && attachments.length === 0)}
            className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
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

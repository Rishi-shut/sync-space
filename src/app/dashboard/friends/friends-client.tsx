"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Video,
  UserCheck,
  UserX,
  UserPlus,
  Clock,
  Mail,
  Check,
  X,
  Plus,
  Loader2,
  Phone,
} from "lucide-react";
import Image from "next/image";

interface Friend {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
  status: string;
  email: string;
}

interface FriendshipItem {
  friendshipId: string;
  friend: Friend;
}

interface RequestItem {
  friendshipId: string;
  requester?: Friend;
  receiver?: Friend;
}

interface FriendsClientProps {
  userId: string;
}

export default function FriendsClient({ userId }: FriendsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "add">("all");
  const [friends, setFriends] = useState<FriendshipItem[]>([]);
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [emailInput, setEmailInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFriendsData = async (signal?: AbortSignal) => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    try {
      const res = await fetch("/api/friends", { signal });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncoming(data.incoming || []);
        setOutgoing(data.outgoing || []);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to load friends:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchFriendsData(controller.signal);
    // Poll friends and requests list every 12 seconds to keep online states synced
    const interval = setInterval(() => fetchFriendsData(controller.signal), 12000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setFormLoading(true);
    setFormSuccess("");
    setFormError("");

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.autoAccepted) {
          setFormSuccess("You are now friends! The pending request was automatically accepted.");
        } else {
          setFormSuccess("Friend request sent successfully!");
        }
        setEmailInput("");
        fetchFriendsData();
      } else {
        const errMsg = await res.text();
        setFormError(errMsg || "Failed to send request.");
      }
    } catch (err) {
      setFormError("An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateFriendship = async (friendshipId: string, action: "ACCEPT" | "DECLINE" | "CANCEL" | "UNFRIEND") => {
    setActionLoading(friendshipId);
    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });

      if (res.ok) {
        fetchFriendsData();
      } else {
        const errorText = await res.text();
        alert(errorText || "Action failed");
      }
    } catch (err) {
      console.error("Friendship action error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Action: Send DM
  const handleStartDM = async (partnerId: string) => {
    setActionLoading(partnerId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DIRECT", partnerId }),
      });

      if (res.ok) {
        const convo = await res.json();
        router.push(`/dashboard/messages/${convo.id}`);
      } else {
        console.error("Failed to start DM");
      }
    } catch (err) {
      console.error("Error starting DM:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Action: Instant Call & Invitation
  const handleInviteToCall = async (friend: Friend) => {
    setActionLoading(friend.id);
    try {
      // 1. Create DM Conversation first
      const convoRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DIRECT", partnerId: friend.id }),
      });

      if (!convoRes.ok) throw new Error("Could not start conversation channel");
      const convo = await convoRes.json();

      // 2. Create Instant Meeting
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Call with ${friend.displayName || "Friend"}` }),
      });

      if (!meetingRes.ok) throw new Error("Could not initialize meeting room");
      const meeting = await meetingRes.json();

      // 3. Post Invitation Link to DM
      const inviteMsg = `I've started a video call! Click the button below to join the room.\n\n[Join Active Call](/dashboard/meetings/${meeting.code})`;
      await fetch(`/api/conversations/${convo.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inviteMsg, type: "TEXT" }),
      });

      // 4. Redirect host into the meeting room
      router.push(`/dashboard/meetings/${meeting.code}`);
    } catch (err: any) {
      alert(err.message || "Failed to invite friend to call");
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Action: Instant Voice Call & Invitation
  const handleInviteToVoiceCall = async (friend: Friend) => {
    setActionLoading(friend.id);
    try {
      // 1. Create DM Conversation first
      const convoRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DIRECT", partnerId: friend.id }),
      });

      if (!convoRes.ok) throw new Error("Could not start conversation channel");
      const convo = await convoRes.json();

      // 2. Create Instant Meeting
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: `Voice Call with ${friend.displayName || "Friend"}`,
          type: "VOICE" 
        }),
      });

      if (!meetingRes.ok) throw new Error("Could not initialize voice room");
      const meeting = await meetingRes.json();

      // 3. Post Invitation Link to DM
      const inviteMsg = `I've started a voice call! Click the button below to join.\n\n[Join Voice Call](/dashboard/meetings/${meeting.code})`;
      await fetch(`/api/conversations/${convo.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inviteMsg, type: "TEXT" }),
      });

      // 4. Redirect host into the meeting room
      router.push(`/dashboard/meetings/${meeting.code}`);
    } catch (err: any) {
      alert(err.message || "Failed to invite friend to voice call");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    ONLINE: "bg-emerald-500",
    AWAY: "bg-amber-500",
    BUSY: "bg-rose-500",
    OFFLINE: "bg-slate-500",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 select-none animate-fadeInUp">
      {/* Header section */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">Friends</h2>
        <p className="text-sm text-text-secondary">
          Keep in touch with colleagues, start direct messaging channels, or launch instant meetings.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          All Friends
          {friends.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-card-hover text-text-secondary font-medium">
              {friends.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-semibold transition-all ${
            activeTab === "pending"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Pending Requests
          {incoming.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold animate-pulse">
              {incoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-semibold transition-all ${
            activeTab === "add"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Add Friend
        </button>
      </div>

      {/* Main content body */}
      <div className="min-h-[250px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── Tab: All Friends ────────────────── */}
            {activeTab === "all" && (
              <div className="space-y-4">
                {friends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {friends.map(({ friendshipId, friend }) => (
                      <div
                        key={friendshipId}
                        className="p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-sm flex items-center justify-between hover:border-accent/40 transition-colors"
                      >
                        {/* Profile Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-border relative">
                              {friend.imageUrl ? (
                                <Image
                                  src={friend.imageUrl}
                                  alt={friend.displayName || "Friend"}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-sidebar-hover flex items-center justify-center text-sm font-bold text-accent">
                                  {friend.displayName?.[0] || "U"}
                                </div>
                              )}
                            </div>
                            <div
                              className={`avatar-status ${friend.status.toLowerCase()}`}
                              style={{ border: "2.5px solid var(--card)", width: "13px", height: "13px" }}
                              title={`Status: ${friend.status}`}
                            />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-text-primary truncate">
                              {friend.displayName || "User"}
                            </h4>
                            <p className="text-[10px] text-text-secondary truncate mt-0.5">
                              {friend.email}
                            </p>
                            <span className="text-[9px] uppercase tracking-wider text-text-muted font-bold block mt-1">
                              {friend.status}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartDM(friend.id)}
                            disabled={actionLoading !== null}
                            className="p-2 rounded-xl border border-border bg-background hover:bg-card-hover text-text-secondary hover:text-text-primary transition-all"
                            title="Message Friend"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleInviteToVoiceCall(friend)}
                            disabled={actionLoading !== null}
                            className="p-2 rounded-xl border border-border bg-background hover:bg-card-hover text-text-secondary hover:text-text-primary transition-all"
                            title="Voice Call"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleInviteToCall(friend)}
                            disabled={actionLoading !== null}
                            className="p-2 rounded-xl border border-border bg-background hover:bg-card-hover text-text-secondary hover:text-text-primary transition-all"
                            title="Invite to Call"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateFriendship(friendshipId, "UNFRIEND")}
                            disabled={actionLoading !== null}
                            className="p-2 rounded-xl border border-border bg-background hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-all"
                            title="Remove Friend"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card/40">
                    <Users className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
                    <h3 className="text-sm font-semibold text-text-primary">No friends added yet</h3>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                      Start building your syncing circle by adding colleagues through their email addresses.
                    </p>
                    <button
                      onClick={() => setActiveTab("add")}
                      className="mt-4 btn-primary py-2 px-4 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Friend
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab: Pending Requests ───────────── */}
            {activeTab === "pending" && (
              <div className="space-y-6">
                {/* Incoming Requests */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Incoming Requests ({incoming.length})
                  </h3>
                  {incoming.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {incoming.map(({ friendshipId, requester }) => (
                        <div
                          key={friendshipId}
                          className="p-4 rounded-2xl border border-border bg-card/85 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden border border-border relative flex-shrink-0">
                              {requester?.imageUrl ? (
                                <Image
                                  src={requester.imageUrl}
                                  alt={requester.displayName || "User"}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-sidebar-hover flex items-center justify-center text-xs font-bold text-accent">
                                  {requester?.displayName?.[0] || "U"}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-text-primary truncate">
                                {requester?.displayName || "User"}
                              </h4>
                              <p className="text-[10px] text-text-secondary truncate">
                                {requester?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateFriendship(friendshipId, "ACCEPT")}
                              disabled={actionLoading !== null}
                              className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              title="Accept Friend Request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateFriendship(friendshipId, "DECLINE")}
                              disabled={actionLoading !== null}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                              title="Decline Friend Request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic p-4">No incoming pending requests.</p>
                  )}
                </div>

                {/* Outgoing Requests */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Sent Requests ({outgoing.length})
                  </h3>
                  {outgoing.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {outgoing.map(({ friendshipId, receiver }) => (
                        <div
                          key={friendshipId}
                          className="p-4 rounded-2xl border border-border bg-card/85 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden border border-border relative flex-shrink-0">
                              {receiver?.imageUrl ? (
                                <Image
                                  src={receiver.imageUrl}
                                  alt={receiver.displayName || "User"}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-sidebar-hover flex items-center justify-center text-xs font-bold text-accent">
                                  {receiver?.displayName?.[0] || "U"}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-text-primary truncate">
                                {receiver?.displayName || "User"}
                              </h4>
                              <p className="text-[10px] text-text-secondary truncate">
                                {receiver?.email}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUpdateFriendship(friendshipId, "CANCEL")}
                            disabled={actionLoading !== null}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-red-500/10 text-[10px] text-text-secondary hover:text-red-400 transition-all"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic p-4">No outgoing pending requests.</p>
                  )}
                </div>
              </div>
            )}

            {/* ─── Tab: Add Friend ─────────────────── */}
            {activeTab === "add" && (
              <div className="max-w-xl mx-auto">
                <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-text-primary">Add Friend by Email</h3>
                    <p className="text-xs text-text-secondary">
                      Invite a colleague or search Sync Space users by their registered email address.
                    </p>
                  </div>

                  <form onSubmit={handleSendRequest} className="space-y-4">
                    <div className="relative">
                      <Mail className="w-4 h-4 text-text-muted absolute left-4 top-3.5" />
                      <input
                        type="email"
                        placeholder="colleague@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="input pl-10 text-xs py-3"
                        disabled={formLoading}
                        required
                      />
                    </div>

                    {formSuccess && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        {formSuccess}
                      </div>
                    )}

                    {formError && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                        {formError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={formLoading || !emailInput.trim()}
                      className="w-full btn-primary py-2.5 justify-center text-xs font-semibold gap-2"
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Send Friend Request
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Copy,
  Check,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface UserInfo {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
  email: string;
}

interface MeetingInfo {
  id: string;
  title: string;
  code: string;
  type: string;
  createdById: string;
  createdBy: { displayName: string | null };
  hasPassword?: boolean;
  requireApproval?: boolean;
}

interface RemotePeer {
  userId: string;
  displayName: string | null;
  imageUrl: string | null;
  stream: MediaStream | null;
}

interface MeetingRoomClientProps {
  user: UserInfo;
  meeting: MeetingInfo;
  initialParticipants: UserInfo[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Stable peer ID unique per user+room (alphanumeric/dash/underscore only) */
function makePeerId(userId: string, meetingCode: string): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `ss_${safe(meetingCode)}_${safe(userId)}`;
}

/** Extract userId from a peerjs peer-id produced by makePeerId */
function extractUserIdFromPeerId(peerId: string, meetingCode: string): string {
  const prefix = `ss_${meetingCode.replace(/[^a-zA-Z0-9_-]/g, "_")}_`;
  return peerId.startsWith(prefix) ? peerId.slice(prefix.length) : peerId;
}

// ─── RemoteVideo — MUST be defined outside the parent component ─────────────────
// If defined inside, React creates a new component type on every render → constant
// unmount/remount → useEffect that attaches srcObject never runs → no video shown.

interface RemoteVideoProps {
  peer: RemotePeer;
}

function RemoteVideo({ peer }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="aspect-video rounded-2xl overflow-hidden border border-[#27272a] bg-[#18181b] flex items-center justify-center relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        // Always render the element; srcObject is set by the effect above.
        // Hidden when no stream so the avatar shows instead.
        className={`w-full h-full object-cover ${peer.stream ? "block" : "hidden"}`}
      />
      {!peer.stream && (
        <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg font-bold select-none">
          {peer.displayName?.[0]?.toUpperCase() || "U"}
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[9px] text-white flex items-center gap-1.5 select-none">
        {peer.stream ? (
          <Wifi className="w-3 h-3 text-emerald-400 flex-shrink-0" />
        ) : (
          <WifiOff className="w-3 h-3 text-amber-400 flex-shrink-0" />
        )}
        <span className="truncate max-w-[120px]">
          {peer.displayName || "Connecting…"}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function MeetingRoomClient({
  user,
  meeting,
  initialParticipants,
}: MeetingRoomClientProps) {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState<UserInfo[]>(initialParticipants);
  const [remotePeers, setRemotePeers] = useState<Record<string, RemotePeer>>({});
  const [peerReady, setPeerReady] = useState(false);
  const isHost = meeting.createdById === user.id;
  const [password, setPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(!meeting.hasPassword || isHost);
  const [passwordError, setPasswordError] = useState("");
  const [isApprovedByHost, setIsApprovedByHost] = useState(!meeting.requireApproval || isHost);
  const [wasDenied, setWasDenied] = useState(false);
  const [pendingParticipants, setPendingParticipants] = useState<any[]>([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Record<string, any>>({});
  // Always-current participants list to avoid stale closures inside PeerJS callbacks
  const participantsRef = useRef<UserInfo[]>(initialParticipants);

  // ── Remote peer state helpers ──────────────────────────────────────────────
  const upsertRemotePeer = useCallback((userId: string, update: Partial<RemotePeer>) => {
    setRemotePeers((prev) => {
      const base: RemotePeer = prev[userId] ?? { userId, displayName: null, imageUrl: null, stream: null };
      return { ...prev, [userId]: { ...base, ...update } };
    });
  }, []);

  const removeRemotePeer = useCallback((userId: string) => {
    setRemotePeers((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    delete connectionsRef.current[userId];
  }, []);

  // ── Keep participantsRef in sync with state ────────────────────────────────
  useEffect(() => {
    participantsRef.current = activeParticipants;
  }, [activeParticipants]);

  // ── Acquire local camera + mic ─────────────────────────────────────────────
  const startLocalMedia = async () => {
    let videoStream: MediaStream | null = null;
    let audioStream: MediaStream | null = null;

    if (camActive) {
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (err) {
        console.warn("[Media] Video acquisition failed:", err);
        setCamActive(false);
      }
    }

    if (micActive) {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } catch (err) {
        console.warn("[Media] Audio acquisition failed:", err);
        setMicActive(false);
      }
    }

    if (!isMountedRef.current) {
      videoStream?.getTracks().forEach((t) => t.stop());
      audioStream?.getTracks().forEach((t) => t.stop());
      return;
    }

    const combinedStream = new MediaStream();
    if (videoStream) {
      videoStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
    }
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
    }

    localStreamRef.current = combinedStream;
    setLocalStream(combinedStream);
    if (localVideoRef.current) localVideoRef.current.srcObject = combinedStream;
  };

  // ── Mount/unmount lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    startLocalMedia();

    const handleUnload = () =>
      navigator.sendBeacon("/api/meetings/leave", JSON.stringify({ code: meeting.code }));

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      navigator.sendBeacon("/api/meetings/leave", JSON.stringify({ code: meeting.code }));
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync local video element when stream or visibility changes ─────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, camActive, joined]);

  // ── Sync screen share element ──────────────────────────────────────────────
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // ── PeerJS — initialize once when the user actually joins ──────────────────
  useEffect(() => {
    if (!joined || !isApprovedByHost) return;

    let peer: any;

    const callParticipant = (p: UserInfo) => {
      if (!localStreamRef.current || !peer) return;
      const targetId = makePeerId(p.id, meeting.code);
      console.log("[PeerJS] Calling →", targetId);
      const call = peer.call(targetId, localStreamRef.current);
      if (!call) return;
      connectionsRef.current[p.id] = call;

      upsertRemotePeer(p.id, { userId: p.id, displayName: p.displayName, imageUrl: p.imageUrl });

      call.on("stream", (remoteStream: MediaStream) => {
        if (!isMountedRef.current) return;
        upsertRemotePeer(p.id, { stream: remoteStream });
      });
      call.on("close", () => removeRemotePeer(p.id));
      call.on("error", (err: any) => {
        console.error("[PeerJS] Outgoing call error:", err);
        removeRemotePeer(p.id);
      });
    };

    const initPeer = async () => {
      const { Peer } = await import("peerjs");
      const myPeerId = makePeerId(user.id, meeting.code);
      console.log("[PeerJS] Initializing as:", myPeerId);

      peer = new Peer(myPeerId, {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });

      peerRef.current = peer;

      peer.on("open", (id: string) => {
        if (!isMountedRef.current) return;
        console.log("[PeerJS] Open. My ID:", id);
        setPeerReady(true);

        // Call everyone currently in the room (using latest ref, not stale closure)
        participantsRef.current
          .filter((p) => p.id !== user.id)
          .forEach(callParticipant);
      });

      // Answer incoming calls
      peer.on("call", (call: any) => {
        if (!isMountedRef.current || !localStreamRef.current) return;
        console.log("[PeerJS] Incoming call from:", call.peer);
        call.answer(localStreamRef.current);

        const remoteUserId = extractUserIdFromPeerId(call.peer, meeting.code);
        connectionsRef.current[remoteUserId] = call;

        // Look up participant info from the latest ref
        const participant = participantsRef.current.find((p) => {
          const safeId = p.id.replace(/[^a-zA-Z0-9_-]/g, "_");
          return safeId === remoteUserId || p.id === remoteUserId;
        });

        upsertRemotePeer(remoteUserId, {
          userId: remoteUserId,
          displayName: participant?.displayName ?? null,
          imageUrl: participant?.imageUrl ?? null,
        });

        call.on("stream", (remoteStream: MediaStream) => {
          if (!isMountedRef.current) return;
          upsertRemotePeer(remoteUserId, { stream: remoteStream });
        });
        call.on("close", () => removeRemotePeer(remoteUserId));
        call.on("error", (err: any) => {
          console.error("[PeerJS] Incoming call error:", err);
          removeRemotePeer(remoteUserId);
        });
      });

      peer.on("error", (err: any) => {
        // peer-unavailable is normal (other person hasn't joined yet); suppress noise
        if (err.type !== "peer-unavailable") {
          console.error("[PeerJS] Peer error:", err.type, err);
        }
      });
    };

    initPeer();

    return () => {
      peer?.destroy();
      peerRef.current = null;
      connectionsRef.current = {};
      setPeerReady(false);
      setRemotePeers({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, isApprovedByHost]);

  // ── Poll meeting state + handle new participants ───────────────────────────
  useEffect(() => {
    if (!joined) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/meetings?code=${meeting.code}${password ? `&password=${encodeURIComponent(password)}` : ""}`);
        if (res.status === 404) {
          localStreamRef.current?.getTracks().forEach((t) => t.stop());
          screenStreamRef.current?.getTracks().forEach((t) => t.stop());
          router.push("/dashboard/meetings?ended=true");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "ENDED") {
          localStreamRef.current?.getTracks().forEach((t) => t.stop());
          screenStreamRef.current?.getTracks().forEach((t) => t.stop());
          router.push("/dashboard/meetings?ended=true");
          return;
        }

        const rawParticipants = data.participants || [];

        // Check if we are approved
        const myParticipant = rawParticipants.find((p: any) => p.userId === user.id);
        if (!isHost) {
          if (!myParticipant) {
            setWasDenied(true);
            return;
          }
          if (myParticipant.isApproved) {
            setIsApprovedByHost(true);
          }
        } else {
          // Host tracks pending requests
          const pending = rawParticipants.filter((p: any) => !p.isApproved);
          setPendingParticipants(pending);
        }

        // Active list only contains approved participants
        const list: UserInfo[] = rawParticipants
          .filter((p: any) => p.isApproved)
          .map((p: any) => p.user);
        
        setActiveParticipants(list);

        // Call anyone who joined after us and isn't already connected
        if (peerRef.current && peerReady && isApprovedByHost) {
          list
            .filter((p) => p.id !== user.id && !connectionsRef.current[p.id])
            .forEach((p) => {
              const targetId = makePeerId(p.id, meeting.code);
              console.log("[PeerJS] Newly joined participant – calling:", targetId);
              const call = peerRef.current.call(targetId, localStreamRef.current);
              if (!call) return;
              connectionsRef.current[p.id] = call;

              upsertRemotePeer(p.id, { userId: p.id, displayName: p.displayName, imageUrl: p.imageUrl });

              call.on("stream", (remoteStream: MediaStream) => {
                if (!isMountedRef.current) return;
                upsertRemotePeer(p.id, { stream: remoteStream });
              });
              call.on("close", () => removeRemotePeer(p.id));
            });
        }

        // Remove peers who left
        const activeIds = new Set(list.map((p) => p.id));
        Object.keys(connectionsRef.current).forEach((uid) => {
          if (!activeIds.has(uid)) removeRemotePeer(uid);
        });
      } catch (err) {
        console.error("[Poll] Error:", err);
      }
    };

    poll(); // immediate first run
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, peerReady]);

  // ── Toggle helpers ─────────────────────────────────────────────────────────

  /**
   * Rebuild the local MediaStream from individual audio/video tracks.
   * Also replaces tracks in all active PeerJS connections so remote peers
   * see the updated stream immediately.
   */
  const applyStreamUpdate = useCallback((audioTrack: MediaStreamTrack | null, videoTrack: MediaStreamTrack | null) => {
    const newStream = new MediaStream();
    if (audioTrack) newStream.addTrack(audioTrack);
    if (videoTrack) newStream.addTrack(videoTrack);

    localStreamRef.current = newStream;
    setLocalStream(newStream);

    if (localVideoRef.current) localVideoRef.current.srcObject = newStream;

    // Replace tracks in existing peer connections so remote side updates live
    Object.values(connectionsRef.current).forEach((call) => {
      try {
        const pc: RTCPeerConnection = call.peerConnection;
        if (!pc) return;
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video" && videoTrack) sender.replaceTrack(videoTrack);
          if (sender.track?.kind === "audio" && audioTrack) sender.replaceTrack(audioTrack);
        });
      } catch (_) { /* ignore */ }
    });
  }, []);

  const toggleMic = async () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;

    if (micActive) {
      // Stop current audio tracks (releases hardware indicator)
      localStreamRef.current?.getAudioTracks().forEach((t) => t.stop());
      setMicActive(false);
      applyStreamUpdate(null, videoTrack);
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMountedRef.current) { s.getTracks().forEach((t) => t.stop()); return; }
        setMicActive(true);
        applyStreamUpdate(s.getAudioTracks()[0], videoTrack);
      } catch (err) {
        console.error("[Media] Failed to re-acquire mic:", err);
      }
    }
  };

  const toggleCam = async () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] ?? null;

    if (camActive) {
      // Fully stop the video track — this releases the hardware and clears the OS indicator
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      setCamActive(false);
      applyStreamUpdate(audioTrack, null);
    } else {
      try {
        // Only request video — audio track is already running (or null if mic is off)
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!isMountedRef.current) { s.getTracks().forEach((t) => t.stop()); return; }
        setCamActive(true);
        applyStreamUpdate(audioTrack, s.getVideoTracks()[0]);
      } catch (err) {
        console.error("[Media] Failed to re-acquire camera:", err);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      screenStreamRef.current = null;
      setScreenSharing(false);
    } else {
      try {
        const s = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
        if (!isMountedRef.current) { s.getTracks().forEach((t: MediaStreamTrack) => t.stop()); return; }
        screenStreamRef.current = s;
        setScreenStream(s);
        setScreenSharing(true);
        s.getVideoTracks()[0].addEventListener("ended", () => {
          setScreenSharing(false);
          setScreenStream(null);
          screenStreamRef.current = null;
        });
      } catch (err) {
        console.error("[Media] Failed to start screen share:", err);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/dashboard/meetings/${meeting.code}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmLeaveMeeting = async () => {
    try {
      await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: meeting.code, status: "LEFT" }),
      });
    } catch (_) { /* ignore */ }

    peerRef.current?.destroy();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    router.push("/dashboard/meetings");
  };

  const confirmEndMeeting = async () => {
    try {
      const res = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: meeting.code, status: "ENDED" }),
      });
      if (res.ok) {
        peerRef.current?.destroy();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenStreamRef.current?.getTracks().forEach((t) => t.stop());
        router.push("/dashboard/meetings");
      }
    } catch (err) {
      console.error("[Meeting] Failed to end meeting:", err);
    }
  };

  const handleLeave = () => {
    setShowLeaveModal(true);
  };

  const handleEndMeeting = () => {
    setShowEndModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SECURITY & WAITING ROOM SCREENS
  // ─────────────────────────────────────────────────────────────────────────────
  if (!passwordVerified) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0c0e] p-6 text-[#f4f4f5]">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPasswordError("");
            try {
              const res = await fetch(`/api/meetings?code=${meeting.code}&password=${encodeURIComponent(password)}`);
              if (res.ok) {
                setPasswordVerified(true);
              } else {
                setPasswordError("Invalid password. Please try again.");
              }
            } catch (err) {
              setPasswordError("Error verifying password.");
            }
          }}
          className="w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-2xl p-8 shadow-2xl space-y-6"
        >
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-accent tracking-wider uppercase">
              Security Check
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">{meeting.title}</h2>
            <p className="text-xs text-[#a1a1aa]">
              This meeting is password-protected. Please enter the password to join.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              placeholder="Meeting password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input text-xs py-2 bg-[#0c0c0e] border-[#27272a] text-white outline-none focus:border-accent/50"
              required
            />
            {passwordError && (
              <p className="text-xs text-rose-500 font-semibold">{passwordError}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/meetings")}
              className="flex-1 btn-secondary py-3 text-xs font-semibold justify-center cursor-pointer"
            >
              Go Back
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-3 text-xs font-semibold justify-center cursor-pointer"
            >
              Verify Password
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (wasDenied) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0c0e] p-6 text-[#f4f4f5]">
        <div className="w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">
              Entry Denied
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Admission Refused</h2>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              The meeting host did not approve your request to join, or you have been removed from the call.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/meetings")}
            className="w-full btn-primary py-3 text-xs font-semibold justify-center cursor-pointer"
          >
            Return to Meetings
          </button>
        </div>
      </div>
    );
  }

  if (joined && !isApprovedByHost) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0c0e] p-6 text-[#f4f4f5]">
        <div className="w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-accent animate-spin mx-auto mb-2" />
            <span className="text-[10px] font-bold text-accent tracking-wider uppercase animate-pulse">
              Waiting Room
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Waiting for Host</h2>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Please wait, the host will let you in shortly.
            </p>
          </div>
          <button
            onClick={handleLeave}
            className="w-full btn-secondary py-3 text-xs font-semibold justify-center cursor-pointer"
          >
            Cancel and Leave
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOBBY SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0c0e] p-6 text-[#f4f4f5]">
        <div className="w-full max-w-2xl bg-[#09090b] border border-[#27272a] rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-accent tracking-wider uppercase">
              Meeting Lobby
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">{meeting.title}</h2>
            <p className="text-xs text-[#a1a1aa]">
              Review your camera and audio settings before joining.
            </p>
          </div>

          {/* Local Video Preview */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0c0c0e] border border-[#27272a] flex items-center justify-center">
            {camActive ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center space-y-2">
                <VideoOff className="w-8 h-8 text-[#52525b] mx-auto" />
                <span className="text-[10px] text-[#52525b] block">Camera is off</span>
              </div>
            )}

            {/* Lobby controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
              <button
                onClick={toggleMic}
                title={micActive ? "Mute" : "Unmute"}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  micActive ? "text-white hover:bg-white/10" : "bg-rose-500/20 text-rose-500"
                }`}
              >
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleCam}
                title={camActive ? "Turn off camera" : "Turn on camera"}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  camActive ? "text-white hover:bg-white/10" : "bg-rose-500/20 text-rose-500"
                }`}
              >
                {camActive ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleLeave}
              className="flex-1 btn-secondary py-3 text-xs font-semibold justify-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => setJoined(true)}
              className="flex-1 btn-primary py-3 text-xs font-semibold justify-center cursor-pointer"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVE CALL SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  const remotePeerList = Object.values(remotePeers);
  const totalParticipants = 1 + remotePeerList.length;

  // Grid columns: 1 person → centred solo tile, 2 → 2 cols, 3-4 → 2 cols, 5+ → 3 cols
  // Adjusted for responsiveness on mobile (stacked/narrower column layouts)
  const gridCols =
    totalParticipants === 1
      ? "grid-cols-1 max-w-xl"
      : totalParticipants === 2
      ? "grid-cols-1 md:grid-cols-2 max-w-4xl"
      : totalParticipants <= 4
      ? "grid-cols-2 max-w-5xl"
      : "grid-cols-2 md:grid-cols-3 max-w-6xl";

  return (
    <div className="w-full h-full flex flex-col bg-[#0c0c0e] text-[#f4f4f5] relative overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="h-16 px-6 border-b border-[#1f1f23]/60 flex items-center justify-between bg-[#09090b] relative z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white truncate max-w-[220px]">{meeting.title}</h3>
            <span className="text-[9px] text-[#52525b] flex items-center gap-1">
              {peerReady ? (
                <>
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  Connected · {totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                  Connecting…
                </>
              )}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[10px] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
          ) : (
            <><Copy className="w-3.5 h-3.5" /><span>Copy Invite</span></>
          )}
        </button>
      </div>

      {/* ── Pending Admission Requests (Host Only) ─────────────────────────── */}
      {isHost && pendingParticipants.length > 0 && (
        <div className="bg-[#18181b] border-b border-[#27272a] px-6 py-3 flex flex-col gap-2 relative z-20 animate-fadeInUp">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
            Pending Admission Requests ({pendingParticipants.length})
          </span>
          <div className="flex flex-wrap gap-3 items-center">
            {pendingParticipants.map((part) => (
              <div
                key={part.id}
                className="flex items-center gap-2 bg-[#09090b] px-3 py-1.5 rounded-xl border border-border"
              >
                <span className="text-xs text-white font-medium">
                  {part.user.displayName || "Guest"}
                </span>
                <div className="flex gap-1.5 ml-2">
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/meetings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            code: meeting.code,
                            status: "APPROVE_PARTICIPANT",
                            targetUserId: part.userId,
                          }),
                        });
                        // update locally
                        setPendingParticipants((prev) => prev.filter((p) => p.id !== part.id));
                      } catch (err) {
                        console.error("Failed to approve:", err);
                      }
                    }}
                    className="px-2.5 py-1 bg-accent text-white text-[9px] font-semibold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
                  >
                    Admit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/meetings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            code: meeting.code,
                            status: "DENY_PARTICIPANT",
                            targetUserId: part.userId,
                          }),
                        });
                        // update locally
                        setPendingParticipants((prev) => prev.filter((p) => p.id !== part.id));
                      } catch (err) {
                        console.error("Failed to deny:", err);
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-500/20 text-rose-500 text-[9px] font-semibold rounded-lg hover:bg-rose-500/30 transition-colors cursor-pointer"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 p-5 flex items-center justify-center overflow-hidden">
        {screenSharing ? (
          /* Screen share layout - stacked on mobile, side-by-side on desktop */
          <div className="w-full h-full flex flex-col md:grid md:grid-cols-4 gap-4 overflow-y-auto md:overflow-hidden">
            <div className="w-full h-auto md:h-full md:col-span-3 aspect-video md:aspect-auto rounded-2xl overflow-hidden border border-[#27272a] bg-black relative flex-shrink-0">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[9px] text-white">
                You are sharing your screen
              </div>
            </div>

            <div className="w-full md:h-full md:col-span-1 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 flex-shrink-0">
              {/* Self tile (small sidebar) */}
              <div className="w-48 md:w-full flex-shrink-0">
                <SelfTile
                  videoRef={localVideoRef}
                  camActive={camActive}
                  displayName={user.displayName}
                  isHost={meeting.createdById === user.id}
                />
              </div>
              {remotePeerList.map((peer) => (
                <div key={peer.userId} className="w-48 md:w-full flex-shrink-0">
                  <RemoteVideo peer={peer} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal grid */
          <div className={`w-full grid gap-5 ${gridCols}`}>
            {/* Self tile */}
            <SelfTile
              videoRef={localVideoRef}
              camActive={camActive}
              displayName={user.displayName}
              isHost={meeting.createdById === user.id}
            />
            {/* Remote peers */}
            {remotePeerList.map((peer) => (
              <RemoteVideo key={peer.userId} peer={peer} />
            ))}
          </div>
        )}
      </div>

      {/* ── Controls bar ────────────────────────────────────────────────────── */}
      <div className="h-24 border-t border-[#1f1f23]/40 flex items-center justify-center bg-gradient-to-t from-[#050507] to-[#0c0c0e] relative z-10 flex-shrink-0">
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#14141b]/65 border border-[#24242e]/60 backdrop-blur-lg shadow-2xl">
          {/* Mic */}
          <ControlBtn
            active={micActive}
            onClick={toggleMic}
            title={micActive ? "Mute Microphone" : "Unmute Microphone"}
            icon={micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          />

          {/* Cam */}
          <ControlBtn
            active={camActive}
            onClick={toggleCam}
            title={camActive ? "Turn Off Camera" : "Turn On Camera"}
            icon={camActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          />

          {/* Screen share */}
          <button
            onClick={toggleScreenShare}
            title={screenSharing ? "Stop Sharing" : "Share Screen"}
            className={`p-3.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-lg ${
              screenSharing
                ? "border-accent/40 bg-accent/25 text-accent shadow-accent/15"
                : "border-[#24242e] bg-[#0c0c10]/80 text-[#a1a1aa] hover:bg-[#1b1b24] hover:text-[#fafafa] shadow-black/20"
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Leave */}
          <button
            onClick={handleLeave}
            title="Leave Meeting"
            className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:scale-105 active:scale-95 transition-all shadow-md shadow-amber-950/10 cursor-pointer flex items-center justify-center"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          {/* End (host only) */}
          {meeting.createdById === user.id && (
            <button
              onClick={handleEndMeeting}
              title="End Meeting for Everyone"
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs border border-rose-500/30 shadow-lg shadow-rose-950/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="text-xs font-bold">End Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* Premium End Meeting Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEndModal(false)} />
          <div className="bg-[#14141b] border border-[#24242e] rounded-2xl p-6 max-w-sm w-full relative z-10 space-y-4 animate-scaleIn shadow-2xl">
            <h3 className="text-sm font-bold text-white">End Meeting?</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Are you sure you want to end this meeting? This will disconnect all participants and delete the meeting room.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowEndModal(false);
                  confirmEndMeeting();
                }}
                className="flex-1 btn-primary bg-rose-600 hover:bg-rose-700 py-2 text-xs font-semibold rounded-xl text-white cursor-pointer"
              >
                Yes, End Meeting
              </button>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="flex-1 btn-secondary bg-[#0f0f13] hover:bg-[#1b1b24] py-2 text-xs font-semibold rounded-xl border border-[#24242e] text-[#fafafa] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Leave Meeting Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)} />
          <div className="bg-[#14141b] border border-[#24242e] rounded-2xl p-6 max-w-sm w-full relative z-10 space-y-4 animate-scaleIn shadow-2xl">
            <h3 className="text-sm font-bold text-white">Leave Meeting?</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Are you sure you want to leave the meeting? Other participants will remain connected.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  confirmLeaveMeeting();
                }}
                className="flex-1 btn-primary bg-rose-600 hover:bg-rose-700 py-2 text-xs font-semibold rounded-xl text-white cursor-pointer"
              >
                Yes, Leave
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 btn-secondary bg-[#0f0f13] hover:bg-[#1b1b24] py-2 text-xs font-semibold rounded-xl border border-[#24242e] text-[#fafafa] cursor-pointer"
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

// ─── Sub-components (defined outside MeetingRoomClient) ─────────────────────────

interface SelfTileProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  camActive: boolean;
  displayName: string | null;
  isHost: boolean;
}

function SelfTile({ videoRef, camActive, displayName, isHost }: SelfTileProps) {
  return (
    <div className="aspect-video rounded-2xl overflow-hidden border border-[#27272a] bg-[#18181b] relative">
      {/* Always keep the video element mounted so srcObject assignment works */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover scale-x-[-1] ${camActive ? "block" : "hidden"}`}
      />
      {!camActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#18181b]">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent text-lg font-bold select-none">
            {displayName?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[9px] text-white select-none">
        {displayName || "You"}{isHost ? " (Host)" : ""}
      </div>
    </div>
  );
}

interface ControlBtnProps {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

function ControlBtn({ active, onClick, title, icon }: ControlBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-3.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-lg ${
        active
          ? "border-[#24242e] bg-[#0c0c10]/80 text-[#fafafa] hover:bg-[#1b1b24] hover:text-white shadow-black/20"
          : "border-rose-500/30 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 shadow-rose-950/20"
      }`}
    >
      {icon}
    </button>
  );
}

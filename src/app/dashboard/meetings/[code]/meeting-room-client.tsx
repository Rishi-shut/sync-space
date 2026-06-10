"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Copy,
  Users,
  Check,
  Zap,
} from "lucide-react";
import Image from "next/image";

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
  createdBy: {
    displayName: string | null;
  };
}

interface MeetingRoomClientProps {
  user: UserInfo;
  meeting: MeetingInfo;
  initialParticipants: UserInfo[];
}

export default function MeetingRoomClient({
  user,
  meeting,
  initialParticipants,
}: MeetingRoomClientProps) {
  const router = useRouter();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState<UserInfo[]>(initialParticipants);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize camera and mic permissions in the lobby
  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to access media devices:", err);
    }
  };

  useEffect(() => {
    startLocalMedia();

    return () => {
      // Clean up tracks when user leaves or closes room
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Set stream to video element when joining or updating camera
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [joined, localStream, camActive]);

  // Set screen share stream to element
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenSharing, screenStream]);

  // Polling to check if meeting status becomes ENDED, and tracking active participants list
  useEffect(() => {
    if (!joined) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/meetings?code=${meeting.code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ENDED") {
            // Stop media streams
            if (localStream) {
              localStream.getTracks().forEach((track) => track.stop());
            }
            if (screenStream) {
              screenStream.getTracks().forEach((track) => track.stop());
            }
            router.push("/dashboard/meetings?ended=true");
          } else {
            // Update active participants list
            const participantsList = data.participants.map((p: any) => p.user);
            setActiveParticipants(participantsList);
          }
        }
      } catch (err) {
        console.error("Error polling meeting state:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [joined, meeting.code, localStream, screenStream, router]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamActive(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);
        setScreenSharing(true);

        stream.getVideoTracks()[0].onended = () => {
          setScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.error("Failed to share screen:", err);
      }
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/dashboard/meetings/${meeting.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    // Notify DB that we are voluntarily leaving the participant list
    try {
      await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: meeting.code, status: "LEFT" }),
      });
    } catch (err) {
      console.error("Failed to notify leave:", err);
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    router.push("/dashboard/meetings");
  };

  const handleEndMeeting = async () => {
    try {
      const res = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: meeting.code, status: "ENDED" }),
      });
      if (res.ok) {
        handleLeave();
      }
    } catch (err) {
      console.error("Failed to end meeting:", err);
    }
  };

  // ─── Render: Lobby Screen ───────────────────
  if (!joined) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0c0e] p-6 text-[#f4f4f5] select-none">
        <div className="w-full max-w-2xl bg-[#09090b] border border-[#27272a] rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-accent tracking-wider uppercase">
              Meeting Lobby
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {meeting.title}
            </h2>
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

            {/* Bottom preview controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-full transition-all ${
                  micActive ? "text-white hover:bg-white/10" : "bg-rose-500/20 text-rose-500"
                }`}
              >
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleCam}
                className={`p-2 rounded-full transition-all ${
                  camActive ? "text-white hover:bg-white/10" : "bg-rose-500/20 text-rose-500"
                }`}
              >
                {camActive ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Join Form CTA */}
          <div className="flex gap-4">
            <button
              onClick={handleLeave}
              className="flex-1 btn-secondary py-3 text-xs font-semibold justify-center"
            >
              Cancel
            </button>
            <button
              onClick={() => setJoined(true)}
              className="flex-1 btn-primary py-3 text-xs font-semibold justify-center"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Active Calling Room ─────────────
  return (
    <div className="w-full h-full flex flex-col bg-[#0c0c0e] text-[#f4f4f5] relative overflow-hidden select-none">
      {/* Top Navbar */}
      <div className="h-16 px-6 border-b border-[#1f1f23]/60 flex items-center justify-between bg-[#09090b] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white truncate max-w-[200px]">
              {meeting.title}
            </h3>
            <span className="text-[9px] text-[#52525b] block">
              Hosted by {meeting.createdBy.displayName || "User"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[10px] text-[#a1a1aa] hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Calling Grid Area */}
      <div className="flex-1 p-6 flex items-center justify-center relative overflow-hidden">
        {screenSharing ? (
          // Screen share active: split layout with large screen presentation
          <div className="w-full h-full grid grid-cols-4 gap-4">
            <div className="col-span-3 rounded-2xl overflow-hidden border border-[#27272a] bg-black relative">
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
            
            {/* Sidebar list for webcam streams */}
            <div className="col-span-1 flex flex-col gap-4 overflow-y-auto max-h-[500px]">
              <div className="aspect-video rounded-xl overflow-hidden border border-[#27272a] bg-[#18181b] relative flex-shrink-0">
                {camActive ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#18181b]">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold">
                      {user.displayName?.[0] || "U"}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-white truncate max-w-[80px]">
                  {user.displayName || "You"}
                </div>
              </div>

              {/* Real participants */}
              {activeParticipants
                .filter((peer) => peer.id !== user.id)
                .map((peer) => (
                  <div
                    key={peer.id}
                    className="aspect-video rounded-xl overflow-hidden border border-[#27272a] bg-[#18181b] flex items-center justify-center relative flex-shrink-0"
                  >
                    {peer.imageUrl ? (
                      <Image
                        src={peer.imageUrl}
                        alt={peer.displayName || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-semibold">
                        {peer.displayName?.[0] || "U"}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-white truncate max-w-[80px]">
                      {peer.displayName || "User"}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          // Standard Calling grid layout
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl max-h-[500px] overflow-y-auto">
            {/* User stream card */}
            <div className="aspect-video rounded-2xl overflow-hidden border border-[#27272a] bg-[#18181b] relative group">
              {camActive ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#18181b]">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent text-lg font-bold">
                    {user.displayName?.[0] || "U"}
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[9px] text-white">
                {user.displayName || "You"} {meeting.createdById === user.id && "(Host)"}
              </div>
            </div>

            {/* Real participants */}
            {activeParticipants
              .filter((peer) => peer.id !== user.id)
              .map((peer) => (
                <div
                  key={peer.id}
                  className="aspect-video rounded-2xl overflow-hidden border border-[#27272a] bg-[#18181b] flex items-center justify-center relative"
                >
                  {peer.imageUrl ? (
                    <Image
                      src={peer.imageUrl}
                      alt={peer.displayName || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg font-bold">
                      {peer.displayName?.[0] || "U"}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[9px] text-white">
                    {peer.displayName || "User"} {meeting.createdById === peer.id && "(Host)"}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Floating Room Controls Bar */}
      <div className="h-20 border-t border-[#1f1f23]/60 flex items-center justify-center bg-[#09090b] relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full border transition-all ${
              micActive
                ? "border-[#27272a] bg-[#18181b] text-white hover:bg-[#27272a]"
                : "border-rose-500/30 bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
            }`}
            title={micActive ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleCam}
            className={`p-3 rounded-full border transition-all ${
              camActive
                ? "border-[#27272a] bg-[#18181b] text-white hover:bg-[#27272a]"
                : "border-rose-500/30 bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
            }`}
            title={camActive ? "Turn Off Camera" : "Turn On Camera"}
          >
            {camActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full border transition-all ${
              screenSharing
                ? "border-accent/40 bg-accent/20 text-accent"
                : "border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
            }`}
            title={screenSharing ? "Stop Sharing Screen" : "Share Screen"}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={handleLeave}
            className="p-3 rounded-full border border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          {meeting.createdById === user.id && (
            <button
              onClick={handleEndMeeting}
              className="p-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-all border border-rose-500/20 flex items-center justify-center gap-1.5 px-4"
              title="End Meeting for Everyone"
            >
              <PhoneOff className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-semibold">End Meeting</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

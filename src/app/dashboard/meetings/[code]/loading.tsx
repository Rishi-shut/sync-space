"use client";

import { useEffect, useState } from "react";
import { Zap, Loader2 } from "lucide-react";

export default function MeetingLoading() {
  const [tipIndex, setTipIndex] = useState(0);
  const tips = [
    "Synchronizing WebRTC media pipelines...",
    "Registering secure PeerJS signaling identifiers...",
    "Verifying room encryption keys and password locks...",
    "Configuring local camera and microphone sources...",
    "Establishing peer routing paths...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] p-6 select-none">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center max-w-sm text-center space-y-6">
        {/* Glow Logo */}
        <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 border border-accent/20 shadow-[0_0_40px_rgba(124,58,237,0.15)] animate-bounce">
          <Zap className="w-8 h-8 text-accent animate-pulse" strokeWidth={2.5} />
        </div>

        {/* Loading Ring & Status */}
        <div className="space-y-2">
          <h2 className="text-md font-bold tracking-tight text-text-primary flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            Entering Communication Space
          </h2>
          <p className="text-xs text-text-secondary h-4 transition-all duration-300">
            {tips[tipIndex]}
          </p>
        </div>

        {/* Cohesive loading bars */}
        <div className="w-48 h-1 bg-[#161925] rounded-full overflow-hidden border border-border/20">
          <div className="h-full w-full animate-loading-bar bg-accent" />
        </div>
      </div>
    </div>
  );
}

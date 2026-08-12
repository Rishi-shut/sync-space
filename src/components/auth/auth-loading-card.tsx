"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

export default function AuthLoadingCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsTakingLong(true), 8000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (isTakingLong) {
    return (
      <div className="w-full rounded-2xl border border-[#cbc6bb] bg-[#faf8f2] p-7 text-center sm:p-9">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#eee8de] text-[#8a4d3e]">
          <WifiOff className="size-5" />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#202421]">
          Authentication could not load
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#676961]">
          Check your connection or browser privacy settings, then try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#202421] px-5 text-sm font-semibold text-white hover:bg-[#343934]"
        >
          <RefreshCw className="size-4" />
          Reload {mode === "sign-in" ? "sign in" : "registration"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[#cbc6bb] bg-[#faf8f2] p-6 sm:p-8">
      <div className="h-7 w-36 animate-pulse rounded bg-[#ded9ce]" />
      <div className="mt-3 h-4 w-60 max-w-full animate-pulse rounded bg-[#e8e3d9]" />
      <div className="mt-8 h-11 animate-pulse rounded-lg bg-[#ded9ce]" />
      <div className="mt-4 h-11 animate-pulse rounded-lg bg-[#e8e3d9]" />
      <p className="mt-6 text-center text-xs text-[#777870]">
        Loading secure {mode === "sign-in" ? "sign in" : "registration"}…
      </p>
    </div>
  );
}

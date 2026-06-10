"use client";

import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07080d] text-[#f0f2f5] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 rounded-2xl border border-red-500/10 bg-[#0f1118] text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20 animate-bounce">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Application Error
            </h1>
            <p className="text-xs text-[#8b8fa3] leading-relaxed">
              Sync Space encountered a critical error. Please reset the app or return to safety.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="p-3 bg-black/40 rounded-lg text-left overflow-x-auto font-mono text-[10px] text-red-400 max-h-32 border border-white/5">
                {error.message || String(error)}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto btn-primary py-2.5 px-4 justify-center gap-2 text-xs font-semibold"
            >
              Reset Session
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#8b8fa3] hover:text-white rounded-xl border border-[#1e2235] bg-[#0d0f17] hover:bg-[#161925] transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

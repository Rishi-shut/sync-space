"use client";

import { useUIStore } from "@/stores/ui-store";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    info: <Info className="w-4 h-4 text-accent" />,
  };

  const borders = {
    success: "border-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]",
    error: "border-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.05)]",
    info: "border-[#1e2235] shadow-[0_0_30px_rgba(124,92,252,0.05)]",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`w-full p-4 rounded-xl border bg-[#0d0f17]/90 backdrop-blur-md flex items-start gap-3 pointer-events-auto ${borders[toast.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <p className="text-xs font-semibold text-[#f0f2f5] flex-1 leading-relaxed">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded-lg text-[#8b8fa3] hover:text-white hover:bg-[#161925] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

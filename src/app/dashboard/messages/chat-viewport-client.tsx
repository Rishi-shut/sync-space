"use client";

import { useParams } from "next/navigation";

export default function ChatViewportClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const activeId = params?.id;

  return (
    <div className={`flex-1 h-full overflow-hidden bg-background ${activeId ? "flex" : "hidden md:flex"}`}>
      {children}
    </div>
  );
}

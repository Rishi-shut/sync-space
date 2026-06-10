import { MessageSquare } from "lucide-react";

export default function MessagesWelcomePage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-[#0c0c0e] select-none">
      <div className="w-16 h-16 rounded-2xl bg-accent/5 border border-accent/20 flex items-center justify-center mb-4 text-accent">
        <MessageSquare className="w-8 h-8" />
      </div>
      <h2 className="text-lg font-bold text-white mb-1">Your Messages</h2>
      <p className="text-xs text-[#a1a1aa] max-w-[280px]">
        Select a conversation from the sidebar list, or start a new direct message thread.
      </p>
    </div>
  );
}

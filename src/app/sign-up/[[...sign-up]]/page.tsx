import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#09090b]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--text-muted) 1px, transparent 1px),
              linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#0f1118] border border-[#1e2235] shadow-[0_0_60px_rgba(124,92,252,0.15)] rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="orb orb-accent"
          style={{ width: "500px", height: "500px", top: "-15%", right: "-10%" }}
        />
        <div
          className="orb orb-cyan"
          style={{ width: "400px", height: "400px", bottom: "-10%", left: "-5%", animationDelay: "-5s" }}
        />
      </div>

      <div className="relative z-10">
        <SignIn
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

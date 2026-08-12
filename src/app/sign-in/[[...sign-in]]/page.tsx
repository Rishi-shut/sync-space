import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, AudioLines, LockKeyhole } from "lucide-react";
import AuthLoadingCard from "@/components/auth/auth-loading-card";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen bg-[#f4f1e9] text-[#202421] lg:grid-cols-[0.88fr_1.12fr]">
      <aside className="hidden border-r border-[#d4cfc4] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold"><span className="grid size-9 place-items-center rounded-md bg-[#202421] text-[#f4f1e9]"><AudioLines className="size-4" /></span>Sync Space</Link>
        <div><span className="mb-6 grid size-11 place-items-center rounded-full border border-[#c9c3b8] bg-[#faf8f2]"><LockKeyhole className="size-4 text-[#8a4d3e]" /></span><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a4d3e]">Welcome back</p><h1 className="mt-4 max-w-md text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#202421] xl:text-6xl">Continue the conversation.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-[#676961]">Your messages, people, calls, and rooms are waiting in the workspace.</p></div>
        <Link href="/" className="flex items-center gap-2 text-xs font-medium text-[#777870] hover:text-[#202421]"><ArrowLeft className="size-3.5" />Back to the home page</Link>
      </aside>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <Link href="/" className="mb-10 flex items-center gap-3 text-sm font-semibold lg:hidden"><span className="grid size-9 place-items-center rounded-md bg-[#202421] text-[#f4f1e9]"><AudioLines className="size-4" /></span>Sync Space</Link>
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/onboarding"
            fallback={<AuthLoadingCard mode="sign-in" />}
          />
          <p className="mt-5 text-center text-[11px] leading-5 text-[#89887f]">Secure authentication is provided by Clerk.</p>
        </div>
      </section>
    </main>
  );
}

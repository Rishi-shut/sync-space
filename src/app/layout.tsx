import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ToastContainer from "@/components/ui/toast-container";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sync Space — Messages, meetings, and people",
  description:
    "A focused communication workspace for direct messages, group conversations, voice calls, video meetings, and screen sharing.",
  keywords: [
    "communication",
    "video calls",
    "messaging",
    "collaboration",
    "team chat",
  ],
  authors: [{ name: "Sync Space" }],
  openGraph: {
    title: "Sync Space — Messages, meetings, and people",
    description:
      "A focused workspace for messaging, voice calls, video meetings, and screen sharing.",
    type: "website",
  },
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#9b4f3e",
    colorBackground: "#f7f4ed",
    colorInputBackground: "#ffffff",
    colorInputText: "#202421",
    colorText: "#202421",
    colorTextSecondary: "#676961",
    borderRadius: "8px",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    formButtonPrimary:
      "h-11 rounded-lg bg-[#9b4f3e] font-semibold hover:bg-[#824132] shadow-none transition-colors duration-150",
    card: "w-full rounded-2xl bg-[#faf8f2] border border-[#cbc6bb] p-6 shadow-[0_18px_55px_rgba(32,36,33,0.08)] sm:p-8",
    header: "text-left",
    headerTitle: "text-2xl font-semibold tracking-[-0.035em] text-[#202421]",
    headerSubtitle: "mt-1 text-sm leading-6 text-[#676961]",
    socialButtonsBlockButton:
      "h-11 rounded-lg bg-white border-[#cbc6bb] text-[#202421] shadow-none hover:bg-[#eeeae1]",
    socialButtonsBlockButtonText: "font-medium text-[#202421]",
    dividerLine: "bg-[#d8d3c8]",
    dividerText: "text-[11px] uppercase tracking-[0.12em] text-[#89887f]",
    formFieldLabel: "text-xs font-semibold text-[#343833]",
    formFieldInput:
      "h-11 rounded-lg bg-white border-[#bdb7ab] text-[#202421] shadow-none focus:border-[#9b4f3e] focus:ring-2 focus:ring-[#9b4f3e]/10",
    formFieldErrorText: "text-[#9a4034]",
    identityPreview: "rounded-lg border border-[#d8d3c8] bg-[#f2eee5]",
    footer: "bg-transparent",
    footerAction: "text-sm text-[#676961]",
    footerActionLink: "font-semibold text-[#9b4f3e] hover:text-[#824132]",
    identityPreviewEditButton: "text-[#9b4f3e] hover:text-[#824132]",
    backLink: "text-[#676961] hover:text-[#202421]",
    alert: "rounded-lg border border-[#d8a198] bg-[#f7e6e2]",
    alertText: "text-[#7e392c]",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ClerkProvider
          appearance={clerkAppearance}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
          afterSignOutUrl="/"
        >
          <ThemeProvider>
            {children}
            <ToastContainer />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

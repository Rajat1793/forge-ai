import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Forge AI · Ship features end-to-end with AI",
  description:
    "Forge AI turns feature requests into PRDs, tasks, GitHub PR reviews, and release approvals through a single AI-powered workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "border border-white/10 bg-slate-950 text-slate-100",
            },
          }}
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forge AI",
  description: "AI-powered product delivery platform for feature requests, PRDs, tasks, reviews, and release approvals.",
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
      </body>
    </html>
  );
}

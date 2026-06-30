"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { authClient } from "@forge-ai/auth/client";

import { Button } from "@/components/ui/button";

export function GitHubAuthButton({ label = "Continue with GitHub" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" });
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-border bg-secondary text-foreground hover:bg-accent"
      onClick={handleClick}
      disabled={loading}
    >
      <Github className="mr-2 size-4" />
      {loading ? "Redirecting…" : label}
    </Button>
  );
}

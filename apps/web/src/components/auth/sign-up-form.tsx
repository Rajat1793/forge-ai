"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@forge-ai/auth/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({ name, email, password });
    if (err) {
      setLoading(false);
      setError(err.message ?? "Could not sign up");
      return;
    }
    // Provision personal workspace
    try {
      await fetch("/api/onboarding/bootstrap", { method: "POST" });
    } catch {
      // non-fatal — user can create one manually
    }
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-200">Name</Label>
        <Input
          id="name"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-white/10 bg-slate-900/60 text-slate-100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-200">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-white/10 bg-slate-900/60 text-slate-100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-white/10 bg-slate-900/60 text-slate-100"
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

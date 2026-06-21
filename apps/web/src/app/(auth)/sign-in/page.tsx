import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign in · Forge AI" };

export default function SignInPage() {
  return (
    <Card className="w-full max-w-md border-white/10 bg-slate-950/60 text-slate-100 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-slate-400">
          Sign in to keep shipping with Forge AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{" "}
          <Link href="/sign-up" className="font-medium text-emerald-300 hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

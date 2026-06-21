import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign up · Forge AI" };

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md border-white/10 bg-slate-950/60 text-slate-100 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription className="text-slate-400">
          Start your AI delivery workflow in under a minute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-emerald-300 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

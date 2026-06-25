import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign in · Forge AI" };

export default function SignInPage() {
  return (
    <Card className="w-full max-w-md border-border bg-card text-foreground backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to keep shipping with Forge AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/sign-up" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

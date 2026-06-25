import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign up · Forge AI" };

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-md border-border bg-card text-foreground backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Start your AI delivery workflow in under a minute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

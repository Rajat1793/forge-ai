import Link from "next/link";

import { OnboardingForm } from "@/components/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@forge-ai/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Onboarding · Forge AI" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });
  if (existing) redirect(`/${existing.workspace.slug}/dashboard`);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border bg-card text-foreground backdrop-blur">
        <CardHeader>
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription className="text-muted-foreground">
            A workspace holds your projects, repos, PRDs, and reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Signed in as {user.email}.{" "}
            <Link href="/api/auth/sign-out" className="underline">
              Sign out
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

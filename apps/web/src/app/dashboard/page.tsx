import { redirect } from "next/navigation";
import { getPrimaryWorkspace, requireUser } from "@/lib/auth";

export default async function DashboardEntryPage() {
  const user = await requireUser();
  const workspace = await getPrimaryWorkspace(user.id);
  if (!workspace) {
    redirect("/onboarding");
  }
  redirect(`/${workspace.slug}/dashboard`);
}

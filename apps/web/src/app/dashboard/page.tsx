import { redirect } from "next/navigation";
import { getOrCreatePrimaryWorkspace, requireUser } from "@/lib/auth";

export default async function DashboardEntryPage() {
  const user = await requireUser();
  const workspace = await getOrCreatePrimaryWorkspace(user);
  redirect(`/${workspace.slug}/dashboard`);
}

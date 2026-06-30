"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewFeatureForm } from "@/components/features/new-feature-form";

type Project = { id: string; name: string };

export function FeatureQuickAdd({
  workspaceSlug,
  projects,
}: {
  workspaceSlug: string;
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> New feature
      </Button>
    );
  }

  return (
    <Card className="w-full border-border bg-secondary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">New feature request</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          <X className="size-4" /> Cancel
        </Button>
      </CardHeader>
      <CardContent>
        <NewFeatureForm workspaceSlug={workspaceSlug} projects={projects} />
      </CardContent>
    </Card>
  );
}

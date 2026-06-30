"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FeatureTabs({
  defaultTab,
  taskCount,
  discovery,
  prd,
  tasks,
}: {
  defaultTab: "discovery" | "prd" | "tasks";
  taskCount: number;
  discovery: ReactNode;
  prd: ReactNode;
  tasks: ReactNode;
}) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList>
        <TabsTrigger value="discovery">Discovery</TabsTrigger>
        <TabsTrigger value="prd">PRD</TabsTrigger>
        <TabsTrigger value="tasks">
          Tasks{taskCount > 0 ? ` (${taskCount})` : ""}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="discovery">{discovery}</TabsContent>
      <TabsContent value="prd">{prd}</TabsContent>
      <TabsContent value="tasks">{tasks}</TabsContent>
    </Tabs>
  );
}

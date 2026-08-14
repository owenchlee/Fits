"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/statistics/overview-tab";
import { TrendsTab } from "@/components/statistics/trends-tab";
import { BodyTab } from "@/components/statistics/body-tab";
import { HistoryTab } from "@/components/statistics/history-tab";

const TABS = ["overview", "trends", "body", "history"] as const;
type StatisticsTab = (typeof TABS)[number];

function isStatisticsTab(value: string | null): value is StatisticsTab {
  return !!value && (TABS as readonly string[]).includes(value);
}

function StatisticsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = isStatisticsTab(params.get("tab")) ? (params.get("tab") as StatisticsTab) : "overview";

  return (
    <div className="pb-6">
      <PageHeader title="Statistics" description="Your strength percentile, trends, body metrics, and history." />

      <Tabs value={tab} onValueChange={(next) => router.replace(`/statistics?tab=${next}`)}>
        <TabsList className="mb-4 grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="trends">
          <TrendsTab />
        </TabsContent>
        <TabsContent value="body">
          <BodyTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <Suspense>
      <StatisticsContent />
    </Suspense>
  );
}

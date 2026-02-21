'use client';

import { useEffect, useState, useCallback } from 'react';
import { MonitorData, getDailyTokens } from '@/components/monitor/types';
import StatusBar from '@/components/monitor/StatusBar';
import AgentSidebar from '@/components/monitor/AgentSidebar';
import AgentHealthSection from '@/components/monitor/AgentHealthSection';
import TokenUsageSection from '@/components/monitor/TokenUsageSection';
import SessionsPanel from '@/components/monitor/SessionsPanel';
import CompletedJobsSection from '@/components/monitor/CompletedJobsSection';
import CronJobsSection from '@/components/monitor/CronJobsSection';
import SessionDetail from '@/components/monitor/SessionDetail';

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/monitor');
      const json: MonitorData = await res.json();
      // Gateway returns sessions nested in a sessions object
      if (json.sessions && !Array.isArray(json.sessions)) {
        const sessionsObj = json.sessions as unknown as { sessions?: unknown[] };
        if (Array.isArray(sessionsObj.sessions)) {
          json.sessions = sessionsObj.sessions as MonitorData['sessions'];
        }
      }
      setData(json);
    } catch {
      setData((prev) =>
        prev ? { ...prev, connected: false, error: 'Failed to fetch' } : null
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalTokens = data?.sessions?.reduce((sum, s) => sum + (s.totalTokens || 0), 0) ?? 0;
  const daily = data?.sessions ? getDailyTokens(data.sessions) : { total: 0 };

  const selectedSession = data?.sessions?.find((s) => s.sessionId === selectedSessionId);

  if (loading && !data) {
    return (
      <div className="flex flex-col h-screen bg-mc-bg">
        {/* Skeleton status bar */}
        <div className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-24 rounded bg-mc-bg-tertiary animate-pulse" />
              <div className="h-4 w-40 rounded bg-mc-bg-tertiary animate-pulse" />
            </div>
            <div className="flex items-center gap-6">
              <div className="h-4 w-20 rounded bg-mc-bg-tertiary animate-pulse" />
              <div className="h-4 w-20 rounded bg-mc-bg-tertiary animate-pulse" />
              <div className="h-4 w-24 rounded bg-mc-bg-tertiary animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Skeleton sidebar */}
          <div className="w-72 border-r border-mc-border bg-mc-bg-secondary p-4 space-y-4">
            <div className="h-4 w-32 rounded bg-mc-bg-tertiary animate-pulse" />
            <div className="space-y-3">
              <div className="h-12 rounded bg-mc-bg-tertiary animate-pulse" />
              <div className="h-12 rounded bg-mc-bg-tertiary animate-pulse" />
              <div className="h-12 rounded bg-mc-bg-tertiary animate-pulse" />
            </div>
          </div>
          {/* Skeleton main content */}
          <main className="flex-1 p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-mc-border bg-mc-bg-secondary">
                <div className="px-4 py-3 border-b border-mc-border">
                  <div className="h-4 w-40 rounded bg-mc-bg-tertiary animate-pulse" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-3 w-full rounded bg-mc-bg-tertiary animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-mc-bg-tertiary animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-mc-bg-tertiary animate-pulse" />
                </div>
              </div>
            ))}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <StatusBar
        connected={data?.connected ?? false}
        sessionCount={data?.sessions?.length ?? 0}
        totalTokens={totalTokens}
        dailyTokens={daily.total}
        lastUpdated={data?.timestamp ?? null}
        onRefresh={fetchData}
      />
      <div className="flex flex-1 overflow-hidden">
        <AgentSidebar
          sessions={data?.sessions ?? []}
          agents={data?.agents ?? []}
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <AgentHealthSection
            sessions={data?.sessions ?? []}
            agents={data?.agents ?? []}
            onRefresh={fetchData}
          />
          <TokenUsageSection
            sessions={data?.sessions ?? []}
            onRefresh={fetchData}
          />
          <SessionsPanel
            sessions={data?.sessions ?? []}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            onRefresh={fetchData}
          />
          <CompletedJobsSection />
          <CronJobsSection cronJobs={data?.cronJobs ?? []} />
        </main>
      </div>
      {selectedSession && (
        <SessionDetail
          sessionId={selectedSession.sessionId}
          sessionKey={selectedSession.key}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}

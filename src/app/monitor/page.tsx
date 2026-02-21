'use client';

import { useEffect, useState, useCallback } from 'react';
import StatusBar from '@/components/monitor/StatusBar';
import SessionsPanel from '@/components/monitor/SessionsPanel';
import AgentsPanel from '@/components/monitor/AgentsPanel';
import SessionDetail from '@/components/monitor/SessionDetail';

interface MonitorData {
  connected: boolean;
  sessions: Array<{
    key: string;
    kind: string;
    displayName?: string;
    channel?: string;
    sessionId: string;
    updatedAt: number;
    thinkingLevel?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    modelProvider?: string;
    model?: string;
    contextTokens?: number;
    abortedLastRun?: boolean;
    lastChannel?: string;
    origin?: {
      label?: string;
      provider?: string;
      surface?: string;
      chatType?: string;
    };
  }>;
  agents: Array<{
    id: string;
    name: string;
    label?: string;
    model?: string;
    channel?: string;
    status?: string;
    [key: string]: unknown;
  }>;
  timestamp: number;
  error?: string;
}

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

  const selectedSession = data?.sessions?.find((s) => s.sessionId === selectedSessionId);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-mc-text-secondary">Connecting to gateway...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <StatusBar
        connected={data?.connected ?? false}
        sessionCount={data?.sessions?.length ?? 0}
        totalTokens={totalTokens}
        lastUpdated={data?.timestamp ?? null}
      />
      <div className="flex flex-1 overflow-hidden">
        <SessionsPanel
          sessions={data?.sessions ?? []}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
        />
        <AgentsPanel agents={data?.agents ?? []} />
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

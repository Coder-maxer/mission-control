'use client';

import { formatDistanceToNow } from 'date-fns';
import { Monitor, RefreshCw } from 'lucide-react';
import { MonitorSession, parseSessionKey } from '@/components/monitor/types';
import SectionCard from '@/components/monitor/SectionCard';

interface SessionsPanelProps {
  sessions: MonitorSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onRefresh: () => void;
}

function getChannelColor(channel?: string): string {
  switch (channel) {
    case 'telegram': return 'text-mc-accent';
    case 'discord': return 'text-mc-accent-purple';
    case 'webchat': return 'text-mc-accent-cyan';
    case 'whatsapp': return 'text-mc-accent-green';
    default: return 'text-mc-text-secondary';
  }
}

export default function SessionsPanel({ sessions, selectedSessionId, onSelectSession, onRefresh }: SessionsPanelProps) {
  const sorted = [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <SectionCard
      title="Active Sessions"
      icon={<Monitor />}
      count={sessions.length}
      actions={
        <button
          onClick={onRefresh}
          className="text-mc-text-secondary cursor-pointer hover:text-mc-accent transition-colors duration-200"
          aria-label="Refresh sessions"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="p-0 overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-mc-bg-secondary">
            <tr className="text-mc-text-secondary text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-2 font-medium">Agent</th>
              <th className="text-left px-4 py-2 font-medium">Context</th>
              <th className="text-left px-4 py-2 font-medium">Model</th>
              <th className="text-left px-4 py-2 font-medium">Channel</th>
              <th className="text-right px-4 py-2 font-medium">Tokens</th>
              <th className="text-right px-4 py-2 font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((session) => {
              const { agent, context } = parseSessionKey(session.key);
              const isSelected = session.sessionId === selectedSessionId;
              const isRecent = Date.now() - session.updatedAt < 300_000; // 5 min

              return (
                <tr
                  key={session.sessionId}
                  onClick={() => onSelectSession(session.sessionId)}
                  className={`border-b border-mc-border/50 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-mc-accent/10'
                      : 'hover:bg-mc-bg-tertiary'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isRecent ? 'bg-mc-accent-green' : 'bg-mc-text-secondary/40'
                        }`}
                      />
                      <span className="text-mc-text font-medium">{agent}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-mc-text-secondary">
                    <span className="truncate max-w-[200px] inline-block">{context}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-mc-accent-yellow text-xs">
                      {session.model || 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${getChannelColor(session.lastChannel || session.channel)}`}>
                      {session.lastChannel || session.channel || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-mc-text-secondary tabular-nums">
                    {(session.totalTokens || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-mc-text-secondary">
                    {session.updatedAt
                      ? formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })
                      : '-'}
                  </td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-mc-text-secondary">
                  No active sessions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

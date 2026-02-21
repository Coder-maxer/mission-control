'use client';

import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  MonitorSession,
  MonitorAgent,
  buildAgentTree,
  getHealthColor,
} from './types';
import SectionCard from './SectionCard';

interface AgentHealthSectionProps {
  sessions: MonitorSession[];
  agents: MonitorAgent[];
  onRefresh: () => void;
}

export default function AgentHealthSection({
  sessions,
  agents,
  onRefresh,
}: AgentHealthSectionProps) {
  const tree = buildAgentTree(sessions, agents);

  const refreshButton = (
    <button
      onClick={onRefresh}
      className="p-1.5 rounded-md text-mc-text-secondary hover:text-mc-text hover:bg-mc-bg-tertiary cursor-pointer transition-colors duration-200"
      title="Refresh"
    >
      <RefreshCw className="w-4 h-4" />
    </button>
  );

  return (
    <SectionCard
      title="Agent Health"
      icon={<Activity />}
      count={tree.length}
      actions={refreshButton}
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {tree.map((agent) => {
          const healthColors = getHealthColor(agent.status);
          const isStale = agent.status === 'stale';
          const totalSessions =
            agent.sessions.length +
            agent.subAgents.reduce((sum, s) => sum + s.sessions.length, 0);

          return (
            <div
              key={agent.name}
              className={`rounded-lg border p-3 ${
                isStale
                  ? 'border-mc-accent-red/30 bg-mc-accent-red/5'
                  : 'border-mc-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-medium text-sm ${agent.color}`}
                >
                  {agent.name}
                </span>
                {isStale && (
                  <AlertTriangle className="w-3.5 h-3.5 text-mc-accent-red" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${healthColors.bg} ${healthColors.text}`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${healthColors.dot}`}
                  />
                  {agent.status}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs text-mc-text-secondary">
                  {agent.lastActive
                    ? formatDistanceToNow(new Date(agent.lastActive), {
                        addSuffix: true,
                      })
                    : 'Never active'}
                </p>
                <p className="text-xs text-mc-text-secondary">
                  {totalSessions} session{totalSessions !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}

        {tree.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-sm text-mc-text-secondary">
              No agents detected
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

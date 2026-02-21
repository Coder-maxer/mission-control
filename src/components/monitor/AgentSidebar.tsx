'use client';

import { Users, ChevronRight } from 'lucide-react';
import {
  MonitorSession,
  MonitorAgent,
  buildAgentTree,
  getHealthColor,
  AGENT_COLORS,
  AGENT_COLOR_HEX,
} from './types';

interface AgentSidebarProps {
  sessions: MonitorSession[];
  agents: MonitorAgent[];
  showAll: boolean;
}

const ACTIVE_THRESHOLD_MS = 20 * 60 * 1000;

export default function AgentSidebar({ sessions, agents, showAll }: AgentSidebarProps) {
  const tree = buildAgentTree(sessions, agents).filter(
    (agent) => showAll || (agent.lastActive && Date.now() - agent.lastActive < ACTIVE_THRESHOLD_MS)
  );

  return (
    <div className="w-72 bg-mc-bg-secondary border-r border-mc-border overflow-y-auto h-full">
      <div className="px-4 py-3 border-b border-mc-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-mc-text-secondary" />
          <h2 className="text-sm font-semibold text-mc-text-secondary uppercase tracking-wider">
            Agents
          </h2>
          <span className="text-xs bg-mc-bg-tertiary text-mc-text px-1.5 py-0.5 rounded">
            {tree.length}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-1">
        {tree.map((agent) => {
          const colorIndex = AGENT_COLORS.indexOf(agent.color as typeof AGENT_COLORS[number]);
          const borderHex = AGENT_COLOR_HEX[colorIndex >= 0 ? colorIndex : 0];
          const healthColors = getHealthColor(agent.status);

          return (
            <div key={agent.name}>
              <div
                className="border-l-2 pl-3 py-2 cursor-pointer transition-colors duration-200 hover:bg-mc-bg-tertiary/50 rounded-r-md"
                style={{ borderColor: borderHex }}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${healthColors.dot}`} />
                  <span className={`font-medium text-sm ${agent.color}`}>
                    {agent.name}
                  </span>
                </div>
                {agent.model && (
                  <p className="text-xs text-mc-text-secondary mt-0.5 pl-4">
                    {agent.model}
                  </p>
                )}
              </div>

              {agent.subAgents.length > 0 && (
                <div className="pl-6 space-y-0.5">
                  {agent.subAgents.map((sub) => {
                    const subHealth = getHealthColor(sub.status);
                    return (
                      <div
                        key={sub.name}
                        className="flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors duration-200 hover:bg-mc-bg-tertiary/50 rounded"
                      >
                        <ChevronRight className="w-3 h-3 text-mc-text-secondary flex-shrink-0" />
                        <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${subHealth.dot}`} />
                        <span className="text-xs text-mc-text-secondary truncate">
                          {sub.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {tree.length === 0 && (
          <p className="text-xs text-mc-text-secondary text-center py-4">
            No agents detected
          </p>
        )}
      </div>
    </div>
  );
}

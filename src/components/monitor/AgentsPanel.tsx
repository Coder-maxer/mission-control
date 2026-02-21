'use client';

interface GatewayAgent {
  id: string;
  name: string;
  label?: string;
  model?: string;
  channel?: string;
  status?: string;
  [key: string]: unknown;
}

interface AgentsPanelProps {
  agents: GatewayAgent[];
}

export default function AgentsPanel({ agents }: AgentsPanelProps) {
  return (
    <div className="w-72 border-l border-mc-border bg-mc-bg-secondary overflow-auto">
      <div className="border-b border-mc-border px-4 py-3">
        <h2 className="text-sm font-semibold text-mc-text-secondary uppercase tracking-wider">
          Agents ({agents.length})
        </h2>
      </div>
      <div className="p-3 space-y-2">
        {agents.map((agent) => (
          <div
            key={agent.id || agent.name}
            className="rounded-lg border border-mc-border bg-mc-bg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-mc-text">{agent.name}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  agent.status === 'active'
                    ? 'bg-mc-accent-green/20 text-mc-accent-green'
                    : 'bg-mc-bg-tertiary text-mc-text-secondary'
                }`}
              >
                {agent.status || 'unknown'}
              </span>
            </div>
            {agent.label && (
              <div className="text-xs text-mc-text-secondary mb-1">{agent.label}</div>
            )}
            {agent.model && (
              <div className="text-xs text-mc-accent-yellow">{agent.model}</div>
            )}
          </div>
        ))}
        {agents.length === 0 && (
          <div className="text-sm text-mc-text-secondary text-center py-4">
            No agents registered
          </div>
        )}
      </div>
    </div>
  );
}

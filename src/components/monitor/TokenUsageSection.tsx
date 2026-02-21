'use client';

import { Coins, RefreshCw, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import SectionCard from './SectionCard';
import {
  MonitorSession,
  formatTokenCount,
  parseSessionKey,
  aggregateTokens,
  AGENT_COLORS,
} from './types';

interface TokenUsageSectionProps {
  sessions: MonitorSession[];
  onRefresh: () => void;
}

interface AgentTokenRow {
  name: string;
  color: string;
  input: number;
  output: number;
  total: number;
}

export default function TokenUsageSection({
  sessions,
  onRefresh,
}: TokenUsageSectionProps) {
  const { input: totalInput, output: totalOutput, total: totalAll } =
    aggregateTokens(sessions);

  // Group sessions by agent name
  const agentMap = new Map<string, MonitorSession[]>();
  for (const session of sessions) {
    const { agent } = parseSessionKey(session.key);
    if (!agentMap.has(agent)) {
      agentMap.set(agent, []);
    }
    agentMap.get(agent)!.push(session);
  }

  // Build per-agent rows sorted by total descending
  const agentRows: AgentTokenRow[] = [];
  let colorIndex = 0;
  for (const [name, agentSessions] of Array.from(agentMap.entries())) {
    const { input, output, total } = aggregateTokens(agentSessions);
    agentRows.push({
      name,
      color: AGENT_COLORS[colorIndex % AGENT_COLORS.length],
      input,
      output,
      total,
    });
    colorIndex++;
  }
  agentRows.sort((a, b) => b.total - a.total);

  return (
    <SectionCard
      title="Token Usage"
      icon={<Coins />}
      actions={
        <button
          onClick={onRefresh}
          className="text-mc-text-secondary hover:text-mc-text transition-colors p-1"
          title="Refresh token data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {/* Top stat cards */}
      <div className="flex gap-4 p-4">
        <div className="flex-1 rounded-lg border border-mc-border bg-mc-bg p-4 text-center">
          <div className="text-2xl font-bold text-mc-text tabular-nums">
            {formatTokenCount(totalAll)}
          </div>
          <div className="text-xs text-mc-text-secondary uppercase mt-1">
            Total Tokens
          </div>
        </div>

        <div className="flex-1 rounded-lg border border-mc-border bg-mc-bg p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <ArrowDownRight className="w-4 h-4 text-mc-accent" />
            <span className="text-2xl font-bold text-mc-text tabular-nums">
              {formatTokenCount(totalInput)}
            </span>
          </div>
          <div className="text-xs text-mc-text-secondary uppercase mt-1">
            Input Tokens
          </div>
        </div>

        <div className="flex-1 rounded-lg border border-mc-border bg-mc-bg p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-mc-accent-green" />
            <span className="text-2xl font-bold text-mc-text tabular-nums">
              {formatTokenCount(totalOutput)}
            </span>
          </div>
          <div className="text-xs text-mc-text-secondary uppercase mt-1">
            Output Tokens
          </div>
        </div>
      </div>

      {/* Per-agent breakdown table */}
      {agentRows.length > 0 && (
        <div className="px-4 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-mc-text-secondary uppercase">
                <th className="text-left py-2 font-medium">Agent</th>
                <th className="text-right py-2 font-medium">Input</th>
                <th className="text-right py-2 font-medium">Output</th>
                <th className="text-right py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {agentRows.map((row) => (
                <tr
                  key={row.name}
                  className="border-t border-mc-border/50"
                >
                  <td className={`py-2 font-medium ${row.color}`}>
                    {row.name}
                  </td>
                  <td className="py-2 text-right text-mc-text-secondary tabular-nums">
                    {formatTokenCount(row.input)}
                  </td>
                  <td className="py-2 text-right text-mc-text-secondary tabular-nums">
                    {formatTokenCount(row.output)}
                  </td>
                  <td className="py-2 text-right text-mc-text font-medium tabular-nums">
                    {formatTokenCount(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-mc-text-secondary italic p-4 pt-0">
        Token counts reflect cumulative session totals from the gateway.
      </p>
    </SectionCard>
  );
}

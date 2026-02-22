'use client';

import { Coins, RefreshCw, ArrowDownRight, ArrowUpRight, DollarSign, Clock } from 'lucide-react';
import SectionCard from './SectionCard';
import {
  MonitorSession,
  formatTokenCount,
  parseSessionKey,
  aggregateTokens,
  getDailyTokens,
  getDailyAgentTokens,
  calculateCost,
  calculateAgentCost,
  formatCost,
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
  cost: number;
  dailyInput: number;
  dailyOutput: number;
}

export default function TokenUsageSection({
  sessions,
  onRefresh,
}: TokenUsageSectionProps) {
  const cumulative = aggregateTokens(sessions);
  const daily = getDailyTokens(sessions);
  const cost = calculateCost(sessions);
  const dailyAgentTokens = getDailyAgentTokens(sessions);

  // Group sessions by agent name
  const agentMap = new Map<string, MonitorSession[]>();
  for (const session of sessions) {
    const { agent } = parseSessionKey(session.key);
    if (!agentMap.has(agent)) {
      agentMap.set(agent, []);
    }
    agentMap.get(agent)!.push(session);
  }

  // Build per-agent rows sorted by daily total descending
  const agentRows: AgentTokenRow[] = [];
  let colorIndex = 0;
  for (const [name, agentSessions] of Array.from(agentMap.entries())) {
    const { input, output, total } = aggregateTokens(agentSessions);
    const agentDaily = dailyAgentTokens[name] || { input: 0, output: 0 };
    agentRows.push({
      name,
      color: AGENT_COLORS[colorIndex % AGENT_COLORS.length],
      input,
      output,
      total,
      cost: calculateAgentCost(agentSessions),
      dailyInput: agentDaily.input,
      dailyOutput: agentDaily.output,
    });
    colorIndex++;
  }
  agentRows.sort((a, b) => (b.dailyInput + b.dailyOutput) - (a.dailyInput + a.dailyOutput));

  return (
    <SectionCard
      title="Token Usage"
      icon={<Coins />}
      actions={
        <button
          onClick={onRefresh}
          className="text-mc-text-secondary hover:text-mc-text cursor-pointer transition-colors p-1"
          title="Refresh token data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {/* Daily usage — primary display */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-mc-text-secondary" />
          <span className="text-xs font-medium text-mc-text-secondary uppercase tracking-wider">
            Today ({daily.resetDate})
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg border border-mc-accent/30 bg-mc-accent/5 p-4 text-center">
            <div className="text-2xl font-bold text-mc-text tabular-nums">
              {formatTokenCount(daily.total)}
            </div>
            <div className="text-xs text-mc-text-secondary uppercase mt-1">
              Total Today
            </div>
          </div>

          <div className="flex-1 rounded-lg border border-mc-border bg-mc-bg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-mc-accent" />
              <span className="text-2xl font-bold text-mc-text tabular-nums">
                {formatTokenCount(daily.input)}
              </span>
            </div>
            <div className="text-xs text-mc-text-secondary uppercase mt-1">
              Input Today
            </div>
          </div>

          <div className="flex-1 rounded-lg border border-mc-border bg-mc-bg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-mc-accent-green" />
              <span className="text-2xl font-bold text-mc-text tabular-nums">
                {formatTokenCount(daily.output)}
              </span>
            </div>
            <div className="text-xs text-mc-text-secondary uppercase mt-1">
              Output Today
            </div>
          </div>

          <div className="flex-1 rounded-lg border border-mc-accent-yellow/30 bg-mc-accent-yellow/5 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <DollarSign className="w-4 h-4 text-mc-accent-yellow" />
              <span className="text-2xl font-bold text-mc-text tabular-nums">
                {formatCost(cost.totalCost)}
              </span>
            </div>
            <div className="text-xs text-mc-text-secondary uppercase mt-1">
              Cost Today
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative — secondary display */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3 text-xs text-mc-text-secondary">
          <span>Cumulative:</span>
          <span className="tabular-nums">{formatTokenCount(cumulative.total)} total</span>
          <span className="text-mc-border">|</span>
          <span className="tabular-nums">{formatTokenCount(cumulative.input)} in</span>
          <span className="text-mc-border">|</span>
          <span className="tabular-nums">{formatTokenCount(cumulative.output)} out</span>
        </div>
      </div>

      {/* Per-agent daily breakdown */}
      {agentRows.length > 0 && (
        <div className="px-4 pb-4 space-y-3">
          {agentRows.map((row) => {
            const agentDailyTotal = row.dailyInput + row.dailyOutput;
            return (
              <div key={row.name} className="rounded-lg border border-mc-border/50 bg-mc-bg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${row.color}`}>{row.name}</span>
                  <div className="flex items-center gap-3 text-xs text-mc-text-secondary">
                    <span className="tabular-nums">{formatTokenCount(agentDailyTotal)} today</span>
                    {row.cost > 0 && (
                      <>
                        <span className="text-mc-border">|</span>
                        <span className="text-mc-accent-yellow tabular-nums">{formatCost(row.cost)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded border border-mc-border/30 bg-mc-bg-secondary px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-mc-accent" />
                      <span className="text-sm font-bold text-mc-text tabular-nums">
                        {formatTokenCount(row.dailyInput)}
                      </span>
                    </div>
                    <div className="text-[10px] text-mc-text-secondary uppercase mt-0.5">Input</div>
                  </div>
                  <div className="flex-1 rounded border border-mc-border/30 bg-mc-bg-secondary px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-mc-accent-green" />
                      <span className="text-sm font-bold text-mc-text tabular-nums">
                        {formatTokenCount(row.dailyOutput)}
                      </span>
                    </div>
                    <div className="text-[10px] text-mc-text-secondary uppercase mt-0.5">Output</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-mc-text-secondary italic px-4 pb-4">
        Daily usage resets at midnight MST.
      </p>
    </SectionCard>
  );
}

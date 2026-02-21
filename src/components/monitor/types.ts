// Monitor types and utility functions

export interface MonitorSession {
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
}

export interface MonitorAgent {
  id: string;
  name: string;
  label?: string;
  model?: string;
  channel?: string;
  status?: string;
  [key: string]: unknown;
}

export interface MonitorData {
  connected: boolean;
  sessions: MonitorSession[];
  agents: MonitorAgent[];
  timestamp: number;
  error?: string;
}

export type AgentHealthStatus = 'live' | 'idle' | 'stale';

export interface AgentTree {
  name: string;
  color: string;
  status: AgentHealthStatus;
  lastActive: number;
  sessions: MonitorSession[];
  model?: string;
  subAgents: {
    name: string;
    status: AgentHealthStatus;
    lastActive: number;
    sessions: MonitorSession[];
  }[];
}

// --- Utility Functions ---

export function parseSessionKey(key: string): {
  agent: string;
  context: string;
  isSubAgent: boolean;
} {
  const parts = key.split(':');
  const agent = parts[1] || parts[0] || 'unknown';
  const context = parts.slice(2).join(':') || '';
  const isSubAgent = context.toLowerCase().includes('subagent');
  return { agent, context, isSubAgent };
}

export function classifyHealth(lastActive: number): AgentHealthStatus {
  const elapsed = (Date.now() - lastActive) / 1000;
  if (elapsed < 120) return 'live';
  if (elapsed < 900) return 'idle';
  return 'stale';
}

export function getHealthColor(status: AgentHealthStatus): {
  dot: string;
  text: string;
  bg: string;
} {
  switch (status) {
    case 'live':
      return {
        dot: 'bg-mc-accent-green',
        text: 'text-mc-accent-green',
        bg: 'bg-mc-accent-green/10',
      };
    case 'idle':
      return {
        dot: 'bg-mc-accent-yellow',
        text: 'text-mc-accent-yellow',
        bg: 'bg-mc-accent-yellow/10',
      };
    case 'stale':
      return {
        dot: 'bg-mc-accent-red',
        text: 'text-mc-accent-red',
        bg: 'bg-mc-accent-red/10',
      };
  }
}

export const AGENT_COLORS = [
  'text-mc-accent',
  'text-mc-accent-green',
  'text-mc-accent-yellow',
  'text-mc-accent-purple',
  'text-mc-accent-pink',
  'text-mc-accent-cyan',
] as const;

export const AGENT_COLOR_HEX = [
  '#58a6ff',
  '#3fb950',
  '#d29922',
  '#a371f7',
  '#db61a2',
  '#39d353',
] as const;

export function buildAgentTree(
  sessions: MonitorSession[],
  agents: MonitorAgent[]
): AgentTree[] {
  const agentMap = new Map<
    string,
    {
      sessions: MonitorSession[];
      subAgents: Map<string, MonitorSession[]>;
      model?: string;
    }
  >();

  for (const session of sessions) {
    const { agent, context, isSubAgent } = parseSessionKey(session.key);

    if (!agentMap.has(agent)) {
      agentMap.set(agent, { sessions: [], subAgents: new Map() });
    }

    const entry = agentMap.get(agent)!;

    if (isSubAgent) {
      const subName = context || 'subagent';
      if (!entry.subAgents.has(subName)) {
        entry.subAgents.set(subName, []);
      }
      entry.subAgents.get(subName)!.push(session);
    } else {
      entry.sessions.push(session);
    }

    if (session.model && !entry.model) {
      entry.model = session.model;
    }
  }

  // Also include agents from the agents list that may not have sessions
  for (const agent of agents) {
    if (!agentMap.has(agent.name)) {
      agentMap.set(agent.name, {
        sessions: [],
        subAgents: new Map(),
        model: agent.model,
      });
    }
  }

  const trees: AgentTree[] = [];
  let colorIndex = 0;

  const agentEntries = Array.from(agentMap.entries());
  for (const [name, data] of agentEntries) {
    const subAgentValues = Array.from(data.subAgents.values());
    const allSessions: MonitorSession[] = [
      ...data.sessions,
      ...subAgentValues.reduce<MonitorSession[]>(
        (acc, arr) => acc.concat(arr),
        []
      ),
    ];
    const lastActive = allSessions.length
      ? Math.max(...allSessions.map((s) => s.updatedAt))
      : 0;
    const status = lastActive ? classifyHealth(lastActive) : 'stale';

    const subAgentEntries = Array.from(data.subAgents.entries());
    const subAgents = subAgentEntries.map(
      ([subName, subSessions]: [string, MonitorSession[]]) => {
        const subLastActive = Math.max(
          ...subSessions.map((s: MonitorSession) => s.updatedAt)
        );
        return {
          name: subName,
          status: classifyHealth(subLastActive),
          lastActive: subLastActive,
          sessions: subSessions,
        };
      }
    );

    trees.push({
      name,
      color: AGENT_COLORS[colorIndex % AGENT_COLORS.length],
      status,
      lastActive,
      sessions: data.sessions,
      model: data.model,
      subAgents,
    });

    colorIndex++;
  }

  // Sort: live first, then idle, then stale
  const statusOrder: Record<AgentHealthStatus, number> = {
    live: 0,
    idle: 1,
    stale: 2,
  };
  trees.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return trees;
}

// --- Daily Token Tracking (MST midnight reset) ---

const MST_TIMEZONE = 'America/Edmonton';

/** Get today's date string in MST (YYYY-MM-DD) */
export function getMSTDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: MST_TIMEZONE });
}

interface DailySnapshot {
  date: string;
  input: number;
  output: number;
  total: number;
}

const STORAGE_KEY = 'monitor-daily-token-snapshot';

function loadSnapshot(): DailySnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(snapshot: DailySnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Calculate today's token usage by comparing current cumulative
 * totals against the midnight MST snapshot. If the date has rolled
 * over, stores the current values as the new baseline.
 */
export function getDailyTokens(sessions: MonitorSession[]): {
  input: number;
  output: number;
  total: number;
  resetDate: string;
} {
  const today = getMSTDateString();
  const current = aggregateTokens(sessions);
  const snapshot = loadSnapshot();

  // First visit ever, or new day — snapshot current as baseline
  if (!snapshot || snapshot.date !== today) {
    saveSnapshot({
      date: today,
      input: current.input,
      output: current.output,
      total: current.total,
    });
    // If it's a brand new day, daily starts at 0
    // If first visit ever, treat current as today's full usage
    if (snapshot && snapshot.date !== today) {
      return { input: 0, output: 0, total: 0, resetDate: today };
    }
    return { ...current, resetDate: today };
  }

  // Same day — calculate delta, clamp to 0 (handles session resets)
  return {
    input: Math.max(0, current.input - snapshot.input),
    output: Math.max(0, current.output - snapshot.output),
    total: Math.max(0, current.total - snapshot.total),
    resetDate: today,
  };
}

export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function aggregateTokens(sessions: MonitorSession[]): {
  input: number;
  output: number;
  total: number;
} {
  let input = 0;
  let output = 0;
  let total = 0;

  for (const session of sessions) {
    input += session.inputTokens || 0;
    output += session.outputTokens || 0;
    total += session.totalTokens || 0;
  }

  return { input, output, total };
}

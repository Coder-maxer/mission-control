'use client';

interface StatusBarProps {
  connected: boolean;
  sessionCount: number;
  totalTokens: number;
  lastUpdated: number | null;
}

export default function StatusBar({ connected, sessionCount, totalTokens, lastUpdated }: StatusBarProps) {
  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const timeAgo = lastUpdated
    ? `${Math.round((Date.now() - lastUpdated) / 1000)}s ago`
    : 'never';

  return (
    <header className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-mc-text">Monitor</h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                connected ? 'bg-mc-accent-green online-glow' : 'bg-mc-accent-red'
              }`}
            />
            <span className={`text-sm ${connected ? 'text-mc-accent-green' : 'text-mc-accent-red'}`}>
              {connected ? 'Gateway Connected' : 'Gateway Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-mc-text-secondary">
          <div>
            <span className="text-mc-text">{sessionCount}</span> sessions
          </div>
          <div>
            <span className="text-mc-text">{formatTokens(totalTokens)}</span> tokens
          </div>
          <div>
            Updated <span className="text-mc-text">{timeAgo}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

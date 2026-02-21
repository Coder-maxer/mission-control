'use client';

import { Radio, RefreshCw } from 'lucide-react';
import { formatTokenCount } from './types';

interface StatusBarProps {
  connected: boolean;
  activeSessionCount: number;
  totalSessionCount: number;
  totalTokens: number;
  dailyTokens: number;
  lastUpdated: number | null;
  onRefresh: () => void;
}

export default function StatusBar({ connected, activeSessionCount, totalSessionCount, totalTokens, dailyTokens, lastUpdated, onRefresh }: StatusBarProps) {

  const timeAgo = lastUpdated
    ? `${Math.round((Date.now() - lastUpdated) / 1000)}s ago`
    : 'never';

  return (
    <header className="border-b border-mc-border bg-mc-bg-secondary px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-mc-accent" />
            <h1 className="text-lg font-semibold text-mc-text">Monitor</h1>
          </div>
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
            <span className="text-mc-text">{activeSessionCount}</span> active
            {totalSessionCount !== activeSessionCount && (
              <span className="text-mc-text-secondary"> ({totalSessionCount} total)</span>
            )}
          </div>
          <div>
            <span className="text-mc-text">{formatTokenCount(dailyTokens)}</span> today
          </div>
          <div className="flex items-center gap-2">
            <span>
              Updated <span className="text-mc-text">{timeAgo}</span>
            </span>
            <button
              onClick={onRefresh}
              className="cursor-pointer hover:text-mc-accent transition-colors duration-200"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

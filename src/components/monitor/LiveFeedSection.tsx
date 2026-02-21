'use client';

import {
  Radio,
  Zap,
  CheckCircle,
  PlusCircle,
  RefreshCw,
  Activity,
  FileText,
  Play,
  Trash2,
} from 'lucide-react';
import SectionCard from './SectionCard';
import type { MonitorEvent } from '@/hooks/useMonitorSSE';

interface LiveFeedSectionProps {
  events: MonitorEvent[];
  connected: boolean;
  onClear: () => void;
}

const EVENT_ICONS: Record<string, typeof Zap> = {
  task_created: PlusCircle,
  task_updated: RefreshCw,
  task_deleted: Trash2,
  agent_spawned: Play,
  agent_completed: CheckCircle,
  activity_logged: Activity,
  deliverable_added: FileText,
};

const EVENT_COLORS: Record<string, string> = {
  task_created: 'text-mc-accent-green',
  task_updated: 'text-mc-accent',
  task_deleted: 'text-mc-accent-red',
  agent_spawned: 'text-mc-accent-purple',
  agent_completed: 'text-mc-accent-green',
  activity_logged: 'text-mc-text-secondary',
  deliverable_added: 'text-mc-accent-cyan',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LiveFeedSection({
  events,
  connected,
  onClear,
}: LiveFeedSectionProps) {
  return (
    <SectionCard
      title="Live Feed"
      icon={<Radio />}
      count={events.length || undefined}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-mc-accent-green animate-pulse' : 'bg-mc-accent-red'
              }`}
            />
            <span className="text-xs text-mc-text-secondary">
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          {events.length > 0 && (
            <button
              onClick={onClear}
              className="text-mc-text-secondary hover:text-mc-text cursor-pointer transition-colors p-1"
              title="Clear feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      }
    >
      {events.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <Radio className="w-12 h-12 text-mc-text-secondary/30 mx-auto" />
          <p className="text-sm text-mc-text-secondary mt-3">
            Listening for events...
          </p>
          <p className="text-xs text-mc-text-secondary/60 mt-1">
            Agent activity will appear here in real-time
          </p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.type] || Zap;
            const colorClass = EVENT_COLORS[event.type] || 'text-mc-text-secondary';

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 px-4 py-2.5 border-b border-mc-border/30 last:border-b-0 hover:bg-mc-bg-tertiary/30 transition-colors"
              >
                <span className="text-xs text-mc-text-secondary/60 tabular-nums mt-0.5 flex-shrink-0 w-16">
                  {formatTime(event.timestamp)}
                </span>
                <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${colorClass}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${colorClass} bg-mc-bg-tertiary`}
                    >
                      {formatEventType(event.type)}
                    </span>
                    {event.agentName && (
                      <span className="text-xs text-mc-accent font-medium">
                        {event.agentName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-mc-text mt-0.5 truncate">
                    {event.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

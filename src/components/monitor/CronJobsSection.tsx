'use client';

import { CalendarClock, CheckCircle2, XCircle, Clock, Timer, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import SectionCard from './SectionCard';
import {
  CronJob,
  AGENT_COLORS,
  formatCronSchedule,
  formatCountdown,
} from './types';

interface CronJobsSectionProps {
  cronJobs: CronJob[];
}

function getAgentColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash << 5) - hash + agentId.charCodeAt(i)) | 0;
  }
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length];
}

function getDeliveryLabel(job: CronJob): string {
  if (!job.delivery || job.delivery.mode === 'none') return 'silent';
  return job.delivery.channel || job.delivery.mode;
}

export default function CronJobsSection({ cronJobs }: CronJobsSectionProps) {
  const sorted = [...cronJobs].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return (a.state.nextRunAtMs || 0) - (b.state.nextRunAtMs || 0);
  });

  const enabledCount = cronJobs.filter((j) => j.enabled).length;

  return (
    <SectionCard
      title="Scheduled Tasks"
      icon={<CalendarClock />}
      count={`${enabledCount}/${cronJobs.length}`}
    >
      {sorted.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <Clock className="w-12 h-12 text-mc-text-secondary/30 mx-auto" />
          <p className="text-sm text-mc-text-secondary mt-3">
            No scheduled tasks configured
          </p>
        </div>
      ) : (
        <div className="p-0 overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-mc-bg-secondary">
              <tr className="text-mc-text-secondary text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Agent</th>
                <th className="text-left px-4 py-2 font-medium">Schedule</th>
                <th className="text-left px-4 py-2 font-medium">Delivery</th>
                <th className="text-left px-4 py-2 font-medium">Next Run</th>
                <th className="text-left px-4 py-2 font-medium">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((job) => {
                const agentColor = getAgentColor(job.agentId);
                const isDisabled = !job.enabled;
                const lastOk = job.state.lastStatus === 'ok';
                const lastError = job.state.lastStatus === 'error';

                return (
                  <tr
                    key={job.id}
                    className={`border-b border-mc-border/50 ${isDisabled ? 'opacity-50' : ''}`}
                    title={job.description || undefined}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isDisabled ? (
                          <Pause className="w-3 h-3 text-mc-text-secondary flex-shrink-0" />
                        ) : (
                          <span className="inline-block h-2 w-2 rounded-full bg-mc-accent-green flex-shrink-0" />
                        )}
                        <span className="text-mc-text font-medium">{job.name}</span>
                      </div>
                    </td>

                    <td className={`px-4 py-3 font-medium ${agentColor}`}>
                      {job.agentId}
                    </td>

                    <td className="px-4 py-3 text-mc-text-secondary">
                      <span className="text-xs">{formatCronSchedule(job.schedule)}</span>
                      {job.schedule.tz && (
                        <span className="text-xs text-mc-text-secondary/60 ml-1">
                          ({job.schedule.tz.split('/').pop()})
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs text-mc-text-secondary">
                        {getDeliveryLabel(job)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {job.state.nextRunAtMs ? (
                        <div>
                          <span className="text-mc-accent text-xs font-medium">
                            {formatCountdown(job.state.nextRunAtMs)}
                          </span>
                          <span className="text-xs text-mc-text-secondary/60 block">
                            {new Date(job.state.nextRunAtMs).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZoneName: 'short',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-mc-text-secondary">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {job.state.lastRunAtMs ? (
                        <div className="flex items-center gap-1.5">
                          {lastOk && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-mc-accent-green flex-shrink-0" />
                          )}
                          {lastError && (
                            <XCircle className="w-3.5 h-3.5 text-mc-accent-red flex-shrink-0" />
                          )}
                          <div>
                            <span className="text-xs text-mc-text-secondary">
                              {formatDistanceToNow(new Date(job.state.lastRunAtMs), { addSuffix: true })}
                            </span>
                            {job.state.lastDurationMs != null && (
                              <span className="text-xs text-mc-text-secondary/60 flex items-center gap-0.5">
                                <Timer className="w-2.5 h-2.5 inline" />
                                {(job.state.lastDurationMs / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-mc-text-secondary">never</span>
                      )}
                      {lastError && job.state.lastError && (
                        <p
                          className="text-xs text-mc-accent-red/80 mt-0.5 truncate max-w-[200px]"
                          title={job.state.lastError}
                        >
                          {job.state.lastError}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

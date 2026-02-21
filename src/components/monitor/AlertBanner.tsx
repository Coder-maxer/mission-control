'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { MonitorData, MonitorAlert, computeAlerts } from './types';

interface AlertBannerProps {
  data: MonitorData;
}

export default function AlertBanner({ data }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const allAlerts = computeAlerts(data);
  const alerts = allAlerts.filter((a) => !dismissed.has(a.id));

  if (alerts.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const criticals = alerts.filter((a) => a.severity === 'critical');
  const warnings = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="space-y-2">
      {criticals.length > 0 && (
        <AlertRow alerts={criticals} severity="critical" onDismiss={dismiss} />
      )}
      {warnings.length > 0 && (
        <AlertRow alerts={warnings} severity="warning" onDismiss={dismiss} />
      )}
    </div>
  );
}

function AlertRow({
  alerts,
  severity,
  onDismiss,
}: {
  alerts: MonitorAlert[];
  severity: 'critical' | 'warning';
  onDismiss: (id: string) => void;
}) {
  const isCritical = severity === 'critical';
  const bgClass = isCritical
    ? 'bg-red-500/10 border-red-500/30'
    : 'bg-yellow-500/10 border-yellow-500/30';
  const textClass = isCritical ? 'text-red-400' : 'text-yellow-400';
  const iconClass = isCritical ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className={`rounded-lg border ${bgClass} px-4 py-3`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconClass}`} />
        <div className="flex-1 space-y-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-2"
            >
              <span className={`text-sm ${textClass}`}>{alert.message}</span>
              <button
                onClick={() => onDismiss(alert.id)}
                className={`${textClass} hover:opacity-70 cursor-pointer flex-shrink-0 p-0.5`}
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

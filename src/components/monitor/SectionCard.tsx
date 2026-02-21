'use client';

import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  icon: ReactNode;
  count?: number | string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function SectionCard({
  title,
  icon,
  count,
  actions,
  children,
}: SectionCardProps) {
  return (
    <div className="rounded-lg border border-mc-border bg-mc-bg-secondary">
      <div className="flex items-center justify-between px-4 py-3 border-b border-mc-border">
        <div className="flex items-center gap-2">
          <span className="text-mc-text-secondary w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </span>
          <h3 className="text-sm font-semibold text-mc-text-secondary uppercase tracking-wider">
            {title}
          </h3>
          {count !== undefined && (
            <span className="text-xs bg-mc-bg-tertiary text-mc-text px-1.5 py-0.5 rounded">
              {count}
            </span>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

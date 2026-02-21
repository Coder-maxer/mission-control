'use client';

import { CalendarClock, Clock } from 'lucide-react';
import SectionCard from './SectionCard';

export default function CronJobsSection() {
  return (
    <SectionCard title="Cron Jobs" icon={<CalendarClock />}>
      <div className="py-12 px-4 text-center">
        <Clock className="w-12 h-12 text-mc-text-secondary/30 mx-auto" />
        <p className="text-sm text-mc-text-secondary mt-3">
          Cron job data is not available from the gateway API
        </p>
        <p className="text-xs text-mc-text-secondary/60 mt-1 max-w-md mx-auto">
          Cron jobs are managed internally by OpenClaw. Access requires direct
          container inspection or a future gateway extension.
        </p>
      </div>
    </SectionCard>
  );
}

'use client';

import { CheckSquare, Inbox } from 'lucide-react';
import SectionCard from './SectionCard';

export default function CompletedJobsSection() {
  return (
    <SectionCard title="Completed Jobs" icon={<CheckSquare />}>
      <div className="py-12 px-4 text-center">
        <Inbox className="w-12 h-12 text-mc-text-secondary/30 mx-auto" />
        <p className="text-sm text-mc-text-secondary mt-3">
          Completed job history is not available from the gateway API
        </p>
        <p className="text-xs text-mc-text-secondary/60 mt-1 max-w-md mx-auto">
          The OpenClaw gateway provides only current session state. A persistent
          job log would require server-side session event tracking.
        </p>
      </div>
    </SectionCard>
  );
}

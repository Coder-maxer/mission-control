/**
 * Gateway Bridge — pipes OpenClaw gateway push events into the SSE broadcast system
 * so the monitor Live Feed can display real-time agent activity.
 */

import { getOpenClawClient } from './client';
import { broadcast } from '../events';
import type { SSEEvent } from '../types';

let initialized = false;

// Helper to broadcast without strict payload typing (gateway events don't match MC task types)
function emit(type: SSEEvent['type'], payload: Record<string, unknown>): void {
  broadcast({ type, payload } as SSEEvent);
}

export function startGatewayBridge(): void {
  if (initialized) return;
  initialized = true;

  const client = getOpenClawClient();

  client.on('notification', (data: Record<string, unknown>) => {
    const event = (data.event as string) || (data.method as string) || '';
    const payload = (data.payload as Record<string, unknown>) || (data.params as Record<string, unknown>) || {};

    // Session activity (messages, output, turns)
    if (event.startsWith('sessions.') || event.startsWith('session.')) {
      const sessionId = (payload.session_id || payload.sessionId || '') as string;
      const agentName = (payload.agent_id || payload.agentId || payload.agent || '') as string;

      if (event.includes('message') || event.includes('output') || event.includes('turn')) {
        emit('activity_logged', {
          id: `gw-${Date.now()}`,
          task_id: '',
          activity_type: 'updated',
          message: `${agentName || 'Agent'}: ${event.split('.').pop()}`,
          created_at: new Date().toISOString(),
          agent: { name: agentName || sessionId || 'Alfred' },
        });
        return;
      }

      if (event.includes('started') || event.includes('created') || event.includes('spawned')) {
        emit('agent_spawned', {
          taskId: '',
          sessionId,
          agentName: agentName || sessionId || 'sub-agent',
        });
        return;
      }

      if (event.includes('ended') || event.includes('completed') || event.includes('closed')) {
        emit('agent_completed', {
          taskId: '',
          sessionId,
          agentName: agentName || sessionId || 'agent',
          summary: 'Session ended',
        });
        return;
      }
    }

    // Agent lifecycle events
    if (event.startsWith('agent.') || event.startsWith('agents.')) {
      const agentName = (payload.agent_id || payload.agentId || payload.name || '') as string;

      if (event.includes('spawn') || event.includes('start')) {
        emit('agent_spawned', {
          taskId: '',
          sessionId: '',
          agentName: agentName || 'sub-agent',
        });
        return;
      }

      if (event.includes('complet') || event.includes('end') || event.includes('finish')) {
        emit('agent_completed', {
          taskId: '',
          sessionId: '',
          agentName: agentName || 'agent',
          summary: 'Agent completed',
        });
        return;
      }
    }

    // Cron events
    if (event.startsWith('cron.')) {
      emit('activity_logged', {
        id: `gw-${Date.now()}`,
        task_id: '',
        activity_type: 'updated',
        message: `Cron: ${event} — ${(payload.name as string) || (payload.job_id as string) || ''}`,
        created_at: new Date().toISOString(),
      });
      return;
    }

    // Catch-all for any other gateway events
    if (event && event !== 'connect.challenge') {
      emit('activity_logged', {
        id: `gw-${Date.now()}`,
        task_id: '',
        activity_type: 'updated',
        message: `Gateway: ${event}`,
        created_at: new Date().toISOString(),
      });
    }
  });

  console.log('[GatewayBridge] Listening for gateway push events');
}

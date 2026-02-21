'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface MonitorEvent {
  id: string;
  type: string;
  timestamp: number;
  agentName?: string;
  summary: string;
}

const MAX_EVENTS = 50;

export function useMonitorSSE() {
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const idCounterRef = useRef(0);

  const clearEvents = useCallback(() => setEvents([]), []);

  useEffect(() => {
    let isConnecting = false;

    const connect = () => {
      if (isConnecting || eventSourceRef.current?.readyState === EventSource.OPEN) {
        return;
      }

      isConnecting = true;
      const eventSource = new EventSource('/api/events/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        isConnecting = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      eventSource.onmessage = (event) => {
        try {
          if (event.data.startsWith(':')) return;

          const parsed = JSON.parse(event.data);
          const id = `evt-${++idCounterRef.current}`;
          const timestamp = Date.now();

          let summary = '';
          let agentName: string | undefined;

          switch (parsed.type) {
            case 'task_created':
              summary = `Task created: ${parsed.payload?.title || 'Untitled'}`;
              agentName = parsed.payload?.created_by_agent?.name;
              break;
            case 'task_updated':
              summary = `Task updated: ${parsed.payload?.title || 'Untitled'} → ${parsed.payload?.status || ''}`;
              agentName = parsed.payload?.assigned_agent?.name;
              break;
            case 'agent_spawned':
              summary = `Agent spawned: ${parsed.payload?.agentName || 'sub-agent'}`;
              agentName = parsed.payload?.agentName;
              break;
            case 'agent_completed':
              summary = `Agent completed: ${parsed.payload?.agentName || 'sub-agent'}`;
              agentName = parsed.payload?.agentName;
              break;
            case 'activity_logged':
              summary = parsed.payload?.message || 'Activity logged';
              agentName = parsed.payload?.agent?.name;
              break;
            case 'deliverable_added':
              summary = `Deliverable: ${parsed.payload?.title || 'file'}`;
              break;
            default:
              summary = `Event: ${parsed.type}`;
          }

          setEvents((prev) => {
            const next = [{ id, type: parsed.type, timestamp, agentName, summary }, ...prev];
            return next.slice(0, MAX_EVENTS);
          });
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        isConnecting = false;
        eventSource.close();
        eventSourceRef.current = null;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return { events, connected, clearEvents };
}

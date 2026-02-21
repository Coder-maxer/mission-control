'use client';

import { useEffect, useState, useCallback } from 'react';

interface HistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface SessionDetailProps {
  sessionId: string;
  sessionKey: string;
  onClose: () => void;
}

export default function SessionDetail({ sessionId, sessionKey, onClose }: SessionDetailProps) {
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/openclaw/sessions/${sessionId}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : data.history || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'text-mc-accent';
      case 'assistant': return 'text-mc-accent-green';
      case 'system': return 'text-mc-accent-yellow';
      default: return 'text-mc-text-secondary';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-mc-bg-secondary border border-mc-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-mc-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-mc-text">Session History</h3>
            <p className="text-xs text-mc-text-secondary mt-0.5">{sessionKey}</p>
          </div>
          <button
            onClick={onClose}
            className="text-mc-text-secondary hover:text-mc-text p-1"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {loading && (
            <div className="text-mc-text-secondary text-sm text-center py-8">Loading history...</div>
          )}
          {error && (
            <div className="text-mc-accent-red text-sm text-center py-8">{error}</div>
          )}
          {!loading && !error && history.length === 0 && (
            <div className="text-mc-text-secondary text-sm text-center py-8">No messages in this session</div>
          )}
          {history.map((msg, i) => (
            <div key={i} className="rounded border border-mc-border/50 bg-mc-bg p-3">
              <div className={`text-xs font-semibold uppercase mb-1 ${getRoleColor(msg.role)}`}>
                {msg.role}
              </div>
              <div className="text-sm text-mc-text whitespace-pre-wrap break-words leading-relaxed">
                {typeof msg.content === 'string'
                  ? msg.content.length > 2000
                    ? msg.content.slice(0, 2000) + '...'
                    : msg.content
                  : JSON.stringify(msg.content, null, 2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

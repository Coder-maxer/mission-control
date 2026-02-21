import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/lib/openclaw/client';

export const dynamic = 'force-dynamic';

// GET /api/monitor - Combined sessions + agents for the monitoring dashboard
export async function GET() {
  const client = getOpenClawClient();

  if (!client.isConnected()) {
    try {
      await client.connect();
    } catch {
      return NextResponse.json({
        connected: false,
        sessions: [],
        agents: [],
        error: 'Failed to connect to OpenClaw Gateway',
      });
    }
  }

  try {
    const [sessions, agents] = await Promise.all([
      client.listSessions().catch(() => []),
      client.listAgents().catch(() => []),
    ]);

    return NextResponse.json({
      connected: true,
      sessions,
      agents,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Monitor API error:', error);
    return NextResponse.json({
      connected: client.isConnected(),
      sessions: [],
      agents: [],
      error: 'Failed to fetch monitoring data',
    });
  }
}

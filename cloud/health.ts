import Parse from 'parse/node';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    latencyMs: number;
  };
}

async function probeDatabaseLatency(): Promise<{ connected: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const query = new Parse.Query('_User');
    query.limit(1);
    await query.find({ useMasterKey: true });
    return { connected: true, latencyMs: Date.now() - start };
  } catch {
    return { connected: false, latencyMs: -1 };
  }
}

Parse.Cloud.define('health', async (): Promise<HealthStatus> => {
  const db = await probeDatabaseLatency();
  const status: HealthStatus['status'] = db.connected ? 'healthy' : 'unhealthy';
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db,
  };
});

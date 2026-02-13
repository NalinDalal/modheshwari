import client from 'prom-client';

// Register default metrics
client.collectDefaultMetrics({ prefix: 'modheshwari_' });

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const errorCounter = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type'],
});

export const notificationDlqSize = new client.Gauge({
  name: 'notification_dlq_size',
  help: 'Number of items currently in notifications DLQ (Redis list)',
});

export async function metricsHandler(): Promise<Response> {
  const body = await client.register.metrics();
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': client.register.contentType },
  });
}

export default client;

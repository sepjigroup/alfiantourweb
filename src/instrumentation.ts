export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAnalyticsWorker } = await import('@/server/analytics/worker');
    startAnalyticsWorker();
  }
}


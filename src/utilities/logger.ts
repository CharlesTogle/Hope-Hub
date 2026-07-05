export const logger = {
  error: (context: string, error: unknown, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', context, error, meta, timestamp: new Date().toISOString() }));
  },
};

export const logger = {
  error: (context: string, error: unknown, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', context, error, meta, timestamp: new Date().toISOString() }));
  },
  warn: (context: string, message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', context, message, meta, timestamp: new Date().toISOString() }));
  },
  info: (context: string, message: string, meta?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: 'info', context, message, meta, timestamp: new Date().toISOString() }));
  },
};

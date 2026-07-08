function normalizeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) return { name: error.name, message: error.message };
  return { name: 'UnknownError', message: String(error) };
}

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (/email|password|token|secret|key/i.test(key)) continue;
    safe[key] = value;
  }
  return safe;
}

export const logger = {
  error: (context: string, error: unknown, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', context, error: normalizeError(error), meta: sanitizeMeta(meta), timestamp: new Date().toISOString() }));
  },
  warn: (context: string, message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', context, message, meta: sanitizeMeta(meta), timestamp: new Date().toISOString() }));
  },
  info: (context: string, message: string, meta?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: 'info', context, message, meta: sanitizeMeta(meta), timestamp: new Date().toISOString() }));
  },
};

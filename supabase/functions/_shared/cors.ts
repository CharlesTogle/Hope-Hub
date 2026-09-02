const allowedOrigins = [
  'https://hopehub.stream'
];

function getAllowOrigin(request: Request): string {
  const origin = request.headers.get('origin') ?? '';
  if (allowedOrigins.includes(origin)) return origin;
  return 'https://hopehub.stream';
}

export function corsHeadersFor(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowOrigin(request),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

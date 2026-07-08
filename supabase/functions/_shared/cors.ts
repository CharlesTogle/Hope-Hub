const allowedOrigins = [
  'https://hope-hub-fitness.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

function getAllowOrigin(request: Request): string {
  const origin = request.headers.get('origin') ?? '';
  if (allowedOrigins.includes(origin)) return origin;
  return 'https://hope-hub-fitness.vercel.app';
}

export function corsHeadersFor(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowOrigin(request),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://hope-hub-fitness.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

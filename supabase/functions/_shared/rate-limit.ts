import { createClient } from "npm:@supabase/supabase-js@2.43.4";
import { corsHeadersFor } from "./cors.ts";

export class RateLimitUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Rate-limit service unavailable", { cause });
    this.name = "RateLimitUnavailableError";
  }
}

export function getClientIp(req: Request): string {
  // These headers are set by the hosting proxy. Do not trust x-forwarded-for,
  // whose first value can be supplied by the caller.
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
  if (!ip) throw new RateLimitUnavailableError("Missing platform client IP");
  return ip;
}

export async function enforceRateLimit(
  req: Request,
  endpoint: string,
  email: string | undefined,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data, error } = await supabase.rpc("check_auth_rate_limit", {
    p_endpoint: endpoint,
    p_ip_address: getClientIp(req),
    p_email_key: email?.trim().toLowerCase() || null,
  });

  if (error) throw new RateLimitUnavailableError(error);
  return {
    allowed: data?.[0]?.allowed === true,
    retryAfterSeconds: data?.[0]?.retry_after_seconds ?? 60,
  };
}

export function rateLimitResponse(req: Request, retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ message: "Too many requests. Please try again later." }), {
    status: 429,
    headers: {
      ...corsHeadersFor(req),
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

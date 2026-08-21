let supabaseUrl: string | undefined;
let serviceRoleKey: string | undefined;
let integrationFlag: string | undefined;
try {
  supabaseUrl = Deno.env.get("SUPABASE_URL");
  serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  integrationFlag = Deno.env.get("RATE_LIMIT_INTEGRATION_TEST");
} catch {
  // The integration test is ignored unless environment access is granted.
}
const isLocalSupabase = supabaseUrl?.startsWith("http://127.0.0.1:") || supabaseUrl?.startsWith("http://localhost:");
const shouldRun = integrationFlag === "local" && isLocalSupabase && Boolean(serviceRoleKey);

async function checkRateLimit(endpoint: string, ip: string, email: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_auth_rate_limit`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_endpoint: endpoint, p_ip_address: ip, p_email_key: email }),
  });

  if (!response.ok) throw new Error(`Rate-limit RPC failed: ${response.status}`);
  return (await response.json())[0] as {
    allowed: boolean;
    retry_after_seconds: number;
  };
}

async function updateLoginWindow(windowSeconds: number) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/auth_rate_limit_config?endpoint=eq.login`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ window_seconds: windowSeconds }),
    },
  );
  if (!response.ok) throw new Error(`Could not update test window: ${response.status}`);
}

Deno.test({
  name: "auth rate limit enforces IP and email buckets concurrently",
  ignore: !shouldRun,
  fn: async () => {
    const suffix = crypto.randomUUID();
    try {
      const email = `rate-limit-${suffix}@example.com`;
      const emailResults = await Promise.all(
        Array.from({ length: 11 }, (_, index) =>
          checkRateLimit("login", `198.51.100.${index + 1}`, email),
        ),
      );
      if (emailResults.filter((result) => result.allowed).length !== 10) {
        throw new Error("Expected exactly 10 concurrent email-bucket requests to be allowed");
      }

      const ipResults = await Promise.all(
        Array.from({ length: 11 }, (_, index) =>
          checkRateLimit("login", "203.0.113.1", `ip-limit-${suffix}-${index}@example.com`),
        ),
      );
      if (ipResults.filter((result) => result.allowed).length !== 10) {
        throw new Error("Expected exactly 10 concurrent IP-bucket requests to be allowed");
      }

      const separateEndpoint = await checkRateLimit(
        "registration",
        "198.51.100.1",
        `${suffix}@example.com`,
      );
      if (!separateEndpoint.allowed) throw new Error("Expected separate endpoint bucket to be independent");

      await updateLoginWindow(1);
      const expiringKey = `expiry-${suffix}@example.com`;
      await checkRateLimit("login", "192.0.2.1", expiringKey);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const afterExpiry = await checkRateLimit("login", "192.0.2.1", expiringKey);
      if (!afterExpiry.allowed) throw new Error("Expected the login window to expire");
    } finally {
      await updateLoginWindow(60);
    }
  },
});

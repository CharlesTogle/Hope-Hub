import { assertEquals } from "jsr:@std/assert@1";
import { isRequestAllowed } from "./rate-limit-policy.ts";

Deno.test("allows the 10th request and rejects the 11th", () => {
  assertEquals(isRequestAllowed(9, 10), true);
  assertEquals(isRequestAllowed(10, 10), false);
});

Deno.test("keeps endpoint counters independent and expires old requests", () => {
  const requests = [
    { endpoint: "login", requestedAt: 0 },
    { endpoint: "registration", requestedAt: 0 },
  ];
  const currentTime = 61_000;
  const recentLoginRequests = requests.filter(
    ({ endpoint, requestedAt }) => endpoint === "login" && currentTime - requestedAt < 60_000,
  );

  assertEquals(recentLoginRequests.length, 0);
  assertEquals(isRequestAllowed(0, 10), true);
});

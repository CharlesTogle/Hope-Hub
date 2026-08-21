export function isRequestAllowed(requestCount: number, maxRequests: number): boolean {
  return requestCount < maxRequests;
}

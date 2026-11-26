const ASYNC_ROUTES_CACHE_PREFIX = "async-routes:";

export function getAsyncRoutesCacheKey(username: string): string {
  return `${ASYNC_ROUTES_CACHE_PREFIX}${encodeURIComponent(username)}`;
}

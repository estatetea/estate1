// Best-effort, per-instance attempt limiter. Serverless instances do not share
// memory, so this slows brute force down rather than guaranteeing a hard cap.
const buckets = globalThis.__estateTeaRateLimits || new Map();
globalThis.__estateTeaRateLimits = buckets;

export function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

export function createLimiter(name, { windowMs, lockMs, maxFailures }) {
  const attempts = buckets.get(name) || new Map();
  buckets.set(name, attempts);

  function stateFor(key) {
    const now = Date.now();
    const old = attempts.get(key);
    if (!old || (now - old.windowStarted > windowMs && old.lockedUntil <= now)) {
      const fresh = { failures: 0, windowStarted: now, lockedUntil: 0 };
      attempts.set(key, fresh);
      return fresh;
    }
    return old;
  }

  return {
    // Seconds until the key may try again, or 0 when it is not locked.
    lockedFor(key) {
      const state = stateFor(key);
      return state.lockedUntil > Date.now() ? Math.ceil((state.lockedUntil - Date.now()) / 1000) : 0;
    },
    // Records a failure and returns how many attempts remain before a lock.
    fail(key) {
      const state = stateFor(key);
      state.failures += 1;
      if (state.failures >= maxFailures) state.lockedUntil = Date.now() + lockMs;
      return Math.max(0, maxFailures - state.failures);
    },
    reset(key) {
      attempts.delete(key);
    },
    lockSeconds: Math.ceil(lockMs / 1000),
  };
}

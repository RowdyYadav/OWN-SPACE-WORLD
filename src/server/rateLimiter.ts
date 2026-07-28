interface RateLimitEntry {
  attempts: number;
  lastAttemptAt: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lockout
const ATTEMPT_WINDOW_MS = 120 * 1000; // 2 minutes window reset

export function checkRateLimit(ip: string): { allowed: boolean; remainingLockoutSec: number; attemptsLeft: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    return { allowed: true, remainingLockoutSec: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  // Check if locked out
  if (entry.lockedUntil > now) {
    const remainingLockoutSec = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remainingLockoutSec, attemptsLeft: 0 };
  }

  // Reset window if elapsed
  if (now - entry.lastAttemptAt > ATTEMPT_WINDOW_MS) {
    rateLimitMap.delete(ip);
    return { allowed: true, remainingLockoutSec: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - entry.attempts);
  return { allowed: true, remainingLockoutSec: 0, attemptsLeft };
}

export function recordFailedAttempt(ip: string): { locked: boolean; lockoutSec: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now - entry.lastAttemptAt > ATTEMPT_WINDOW_MS) {
    entry = { attempts: 1, lastAttemptAt: now, lockedUntil: 0 };
  } else {
    entry.attempts += 1;
    entry.lastAttemptAt = now;
  }

  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitMap.set(ip, entry);
    return { locked: true, lockoutSec: LOCKOUT_DURATION_MS / 1000 };
  }

  rateLimitMap.set(ip, entry);
  return { locked: false, lockoutSec: 0 };
}

export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

/** Run async work over items with a fixed concurrency limit. */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return []
  const limit = Math.max(1, Math.min(concurrency, items.length))
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await fn(items[index]!, index)
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()))
  return results
}

export function isTransientNetworkError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /Failed to fetch|NetworkError|ERR_FAILED|ECONNRESET|ETIMEDOUT|network/i.test(message)
}

/** Retry transient network failures with short backoff. */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number },
): Promise<T> {
  const retries = options?.retries ?? 2
  const baseDelayMs = options?.baseDelayMs ?? 250
  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isTransientNetworkError(err) || attempt === retries) throw err
      await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)))
    }
  }

  throw lastErr
}

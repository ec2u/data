# Cross-Process Rate Limit Coordination

## Current Implementation

The codebase uses **jittered exponential backoff** for handling Gemini API rate limits (see `retry.ts`). This approach:

- ✅ Works for single-process scenarios
- ✅ Respects API-provided retry delays
- ✅ Adds random jitter to prevent thundering herd
- ⚠️ Reactive (waits for 429 errors rather than preventing them)
- ⚠️ Multiple concurrent processes may compete for shared quota

## Future: Multi-Process Coordination

If running multiple processes concurrently (e.g., expanding multiple departments in parallel), consider implementing one
of these coordination strategies:

---

### Option 1: Token Bucket in Datastore (Recommended)

Track quota usage across all processes using Google Cloud Datastore.

#### Quota Metrics

```
gemini-2.5-flash:
  - Tokens per minute (TPM): 1,000,000
  - Requests per minute (RPM): varies by tier
  - Requests per day (RPD): varies by tier
```

#### Implementation Sketch

```typescript
// File: src/utilities/gcp/quota.ts

import { datastore } from "@/utilities/gcp/datatsore";

interface QuotaBucket {
	windowStart: number;      // Timestamp of current minute window
	tokensUsed: number;       // Tokens consumed in this window
	requestCount: number;     // Requests made in this window
	limit: {
		tokensPerMinute: number;
		requestsPerMinute: number;
	};
}

/**
 * Atomically reserves tokens from the shared quota bucket.
 *
 * @param estimatedTokens - Estimated tokens for the request
 * @throws QuotaExhaustedError if quota unavailable
 */
async function acquireTokens(estimatedTokens: number): Promise<void> {
	const transaction = datastore.transaction();

	try {
		await transaction.run();

		const bucketKey = datastore.key(['QuotaBucket', 'gemini-2.5-flash-tpm']);
		const [bucket] = await transaction.get(bucketKey);

		const now = Date.now();
		const windowStart = Math.floor(now/60000)*60000; // Current minute

		// Reset if new window
		if ( !bucket || bucket.windowStart !== windowStart ) {
			bucket.windowStart = windowStart;
			bucket.tokensUsed = 0;
			bucket.requestCount = 0;
			bucket.limit = {
				tokensPerMinute: 1_000_000,
				requestsPerMinute: 1000 // Adjust based on tier
			};
		}

		// Check if we have quota
		if ( bucket.tokensUsed+estimatedTokens > bucket.limit.tokensPerMinute ) {
			const waitMs = (windowStart+60000)-now; // Wait until next window
			throw new QuotaExhaustedError(waitMs, 'tokens');
		}

		if ( bucket.requestCount+1 > bucket.limit.requestsPerMinute ) {
			const waitMs = (windowStart+60000)-now;
			throw new QuotaExhaustedError(waitMs, 'requests');
		}

		// Reserve tokens and increment request count
		bucket.tokensUsed += estimatedTokens;
		bucket.requestCount += 1;
		transaction.save({ key: bucketKey, data: bucket });

		await transaction.commit();

	} catch ( error ) {
		await transaction.rollback();
		throw error;
	}
}

/**
 * Adjusts token usage after receiving actual token count from API.
 *
 * @param adjustment - Difference between estimated and actual tokens (can be negative)
 */
async function adjustTokens(adjustment: number): Promise<void> {
	if ( adjustment === 0 ) return;

	const transaction = datastore.transaction();

	try {
		await transaction.run();

		const bucketKey = datastore.key(['QuotaBucket', 'gemini-2.5-flash-tpm']);
		const [bucket] = await transaction.get(bucketKey);

		if ( bucket ) {
			bucket.tokensUsed += adjustment;
			// Ensure we don't go negative
			bucket.tokensUsed = Math.max(0, bucket.tokensUsed);
			transaction.save({ key: bucketKey, data: bucket });
			await transaction.commit();
		} else {
			await transaction.rollback();
		}

	} catch ( error ) {
		await transaction.rollback();
		// Don't throw - adjustment is best-effort
	}
}

/**
 * Wraps API call with quota management.
 */
export async function withQuotaManagement<T>(
	estimatedTokens: number,
	fn: () => Promise<{ result: T; actualTokens: number }>
): Promise<T> {
	// Wait if quota exhausted
	while ( true ) {
		try {
			await acquireTokens(estimatedTokens);
			break;
		} catch ( error ) {
			if ( error instanceof QuotaExhaustedError ) {
				await sleep(error.waitMs);
			} else {
				throw error;
			}
		}
	}

	// Execute
	const { result, actualTokens } = await fn();

	// Adjust for actual usage
	const adjustment = actualTokens-estimatedTokens;
	await adjustTokens(adjustment);

	return result;
}
```

#### Usage Example

```typescript
import { withQuotaManagement } from "@/utilities/gcp/quota";

// Before each API call
const response = await withQuotaManagement(
	5000, // Estimated input tokens
	async () => {
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: conversationHistory,
			config: { tools: toolDeclarations }
		});

		const actualTokens = response.usageMetadata?.totalTokenCount ?? 5000;

		return { result: response, actualTokens };
	}
);
```

#### Pros/Cons

**Pros:**

- ✅ Works across multiple processes/machines
- ✅ Prevents quota exhaustion proactively
- ✅ Atomic operations via transactions
- ✅ Natural rate limiting
- ✅ Can track multiple quota dimensions (TPM, RPM, RPD)

**Cons:**

- ⚠️ Adds latency (~50-100ms per Datastore transaction)
- ⚠️ Requires token estimation (not always accurate)
- ⚠️ More complex error handling
- ⚠️ Datastore costs (minimal for this use case)

---

### Option 2: Request Queue Architecture

Single worker process handles all Gemini API requests.

```
Process A ─┐
Process B ─┼─→ [Datastore Queue] ─→ [Worker Process] ─→ Gemini API
Process C ─┘
```

#### Implementation Approach

1. **Producers** (expand processes) write requests to Datastore queue
2. **Consumer** (single worker) processes queue with rate limiting
3. **Results** written back to Datastore for producers to retrieve

#### Pros/Cons

**Pros:**

- ✅ Perfect rate limit control
- ✅ No coordination complexity
- ✅ Can implement sophisticated scheduling (priority, batching)

**Cons:**

- ⚠️ Major architectural change
- ⚠️ Requires worker process management
- ⚠️ Single point of failure
- ⚠️ Increased latency (queue round-trip)

---

### Option 3: Advisory Locks (Not Recommended)

Use Datastore entity as a distributed lock to serialize all API calls.

**Why not recommended:**

- Only one process can make API calls at a time
- Severely limits throughput
- Lock contention overhead
- Doesn't efficiently utilize available quota

---

## Token Estimation Strategies

Accurate token estimation is critical for proactive quota management.

### Approach 1: Conservative Upper Bound

```typescript
function estimateTokens(content: string): number {
	// Conservative: ~4 characters per token for English text
	const textLength = content.length;
	const estimatedTokens = Math.ceil(textLength/3); // Overestimate

	return estimatedTokens;
}
```

### Approach 2: Historical Average

```typescript
// Track actual usage over time
const tokenHistory = new Map<string, { estimated: number; actual: number }>();

function estimateWithHistory(content: string, model: string): number {
	const baseEstimate = content.length/3;

	// Adjust based on historical accuracy for this model
	const history = tokenHistory.get(model);
	if ( history ) {
		const ratio = history.actual/history.estimated;
		return Math.ceil(baseEstimate*ratio);
	}

	return Math.ceil(baseEstimate);
}
```

### Approach 3: Use Gemini API's countTokens

```typescript
// Most accurate but requires API call
const tokenCount = await ai.models.countTokens({
	model: "gemini-2.5-flash",
	contents: conversationHistory
});

await acquireTokens(tokenCount);
```

**Trade-off:** `countTokens` is accurate but adds latency and consumes quota.

---

## Monitoring and Observability

Track quota usage and effectiveness:

```typescript
// Log quota metrics
interface QuotaMetrics {
	timestamp: number;
	tokensUsed: number;
	requestCount: number;
	rateLimitHits: number;
	averageWaitTime: number;
}

// Export to monitoring system
async function recordMetrics(metrics: QuotaMetrics): Promise<void> {
	// Write to Datastore, Cloud Logging, or monitoring service
}
```

---

## Migration Path

1. **Current:** Single process with jittered backoff (implemented)
2. **Phase 1:** Add token bucket if running multiple processes (this document)
3. **Phase 2:** Add monitoring and observability
4. **Phase 3:** Consider queue architecture if coordination overhead becomes significant

---

## References

- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google Cloud Datastore Transactions](https://cloud.google.com/datastore/docs/concepts/transactions)
- [Exponential Backoff Best Practices](https://cloud.google.com/blog/products/ai-machine-learning/learn-how-to-handle-429-resource-exhaustion-errors-in-your-llms)

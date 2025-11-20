# Gemini API vs Vertex AI: Quotas & Limits Comparison

## Gemini API (ai.google.dev)

**Tier-based rate limits** with fixed quotas:

| Tier       | Cost                | Gemini 2.5 Flash            | Gemini 2.5 Pro             |
|------------|---------------------|-----------------------------|----------------------------|
| **Free**   | $0                  | 10 RPM / 250K TPM / 250 RPD | 2 RPM / 125K TPM / 50 RPD  |
| **Tier 1** | Billing enabled     | 1,000 RPM / 1M TPM          | 150 RPM / 2M TPM / 10K RPD |
| **Tier 2** | >$250 spend + 30d   | Higher limits               | Higher limits              |
| **Tier 3** | >$1,000 spend + 30d | Highest limits              | 2,000 RPM / 8M TPM         |

**Characteristics:**

- Fixed, predictable limits per tier
- Requires spending thresholds to unlock higher tiers
- Daily quotas reset at midnight Pacific time
- Authentication: API key
- Best for: prototyping, small projects, individual developers

## Vertex AI (GCP)

**Dynamic Shared Quota (DSQ)** for Gemini 2.0+ models:

| Model                | Quota System                                |
|----------------------|---------------------------------------------|
| Gemini 2.5 Pro/Flash | **No fixed quotas** - dynamically allocated |
| Gemini 2.0 Flash/Pro | **No fixed quotas** - dynamically allocated |
| Gemini 1.5 models    | Standard quota system (region-dependent)    |

**Characteristics:**

- No quota increase requests needed for 2.0+ models
- Capacity distributed dynamically across all customers
- Regional availability affects capacity
- Embeddings: 5M tokens/min, 250 inputs/request
- Authentication: Application Default Credentials (ADC)
- Best for: production workloads, enterprise applications

## Code Changes Required

**Minimal**: Only the `GoogleGenAI` initialization changes

```typescript
// Current (Gemini API)
new GoogleGenAI({
	apiKey: await secret("googleai-key")
})

// Switch to Vertex AI
new GoogleGenAI({
	vertexai: true,
	project: 'your-gcp-project-id',
	location: 'us-central1'
})
```

All other code remains unchanged (same API surface).

## Decision Factors

| Factor                  | Gemini API              | Vertex AI                             |
|-------------------------|-------------------------|---------------------------------------|
| **Predictability**      | Fixed limits per tier   | Dynamic allocation                    |
| **Quota increases**     | Automatic with spending | Not needed (DSQ)                      |
| **Authentication**      | API key                 | ADC                                   |
| **Integration**         | Standalone              | Full GCP integration                  |
| **Billing**             | Separate                | Unified GCP billing                   |
| **Enterprise features** | Limited                 | VPC-SC, audit logs, private endpoints |

## Recommendation

**Switch to Vertex AI** if:

- Running in production on GCP infrastructure
- Need higher/unpredictable throughput (DSQ handles bursts better)
- Want unified GCP billing and audit logs
- Prefer ADC over managing API keys

**Stay with Gemini API** if:

- Need predictable rate limits for budgeting
- Currently in free tier and staying under limits
- Want separation between GCP billing and AI costs

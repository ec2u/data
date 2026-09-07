This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# References

## Utilities

- [Dedent](https://github.com/dmnd/dedent) - ES6 string tag that strips indentation from multi-line strings
- [@metreeca/flow](https://github.com/metreeca/flow) - TypeScript library for processing async iterables with
  composable, type-safe pipelines

## Google Cloud Platform

- [Google GenAI SDK](https://googleapis.github.io/js-genai/release_docs/index.html) - Google Generative AI SDK for
  JavaScript/TypeScript
- [Google Cloud Datastore](https://cloud.google.com/nodejs/docs/reference/datastore/latest) - Google Cloud Datastore
  client library
- [Google Cloud Secret Manager](https://cloud.google.com/nodejs/docs/reference/secret-manager/latest) - Google Cloud
  Secret Manager client library
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
  - [API Keys and Authentication](https://ai.google.dev/gemini-api/docs/api-key)
  - [Gemini Models](https://ai.google.dev/models)
  - [API Pricing](https://ai.google.dev/pricing)
  - [Rate Limits](https://ai.google.dev/rate-limits)

# Task Workflows

## NPM Scripts

- **`npm run clean`** - Remove dependencies and build artefacts
- **`npm run prime`** - Install dependencies from the lockfile and configure the GCP project
- **`npm run setup`** - Configure for local development
- **`npm run build`** - Compile sources and copy `*.sys.md` prompts alongside their modules
- **`npm run check`** - Run the test suite
- **`npm run serve`** - Serve the endpoints in watch mode

## Testing

- **Run a single test file**: `npm run check -- path/to/test.ts`

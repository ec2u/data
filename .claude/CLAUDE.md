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

- **`npm run clean`** - Remove build artifacts and dependencies (lib, node_modules)
- **`npm run setup`** - Install dependencies and apply security fixes
- **`npm run build`** - Compile TypeScript to lib directory and copy `*.sys.md` prompts alongside their modules
- **`npm run check`** - Run Vitest test suite
- **`npm run serve`** - Start development server with watch mode

## Local Packages

> [!CAUTION]
> **`npm install` replaces symlinked local packages with registry copies.** Before installing, list the symlinks under
> `node_modules/@metreeca`; after installing, reinstate every one of them with `npx link <path to local package>`.
> Skipping this silently swaps the working copies for published ones, surfacing as type errors in modules left
> untouched.

## Testing

- **Run all tests**: `npm run check`
- **Run specific test file**: `npm run check -- path/to/test.ts`
- Tests are written using Vitest and located in `*.test.ts` files alongside the source code

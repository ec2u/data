---
title: Oracle
summary: Natural language query (NLQ) interface to the Knowledge Hub graph
description: Scope, boundaries and open decisions for the oracle package, ahead of its implementation.
---

# Purpose

The oracle lets users ask questions about the Knowledge Hub in plain language and get answers computed from the graph.
It turns each question into queries over the data, runs them, and returns an answer together with the evidence behind
it. Users therefore need neither SPARQL nor knowledge of the data model.

# Boundaries

- **Separate from the server**: the oracle is its own package and its own service. It must not be mounted on the
	`server` routes or share its process. The separation serves two goals:
	- **Independent lifecycle**: the oracle is released, deployed and rolled back without touching the server, and
		the reverse holds too.
	- **Selective access**: access to the oracle is granted to its own set of callers, apart from the public data
		endpoints of the server.
- **Read-only**: the oracle never writes to the store. It connects as the read-only GraphDB user
	`data-{branch}-oracle`, so write access stays with the loader.
- **Grounded**: every answer derives from data retrieved from the graph. Answers state the queries or resources they
	rest on, so users can check them.
- **Shared model**: shapes, taxonomies and vocabularies come from `@ec2u/data-shared` and are never redefined here.

# Package Layout

The package follows the layout of its siblings (`server`, `loader`):

- `package.json` named `@ec2u/data-oracle`
- `tsconfig.build.json` referencing `_` and `shared`
- `src/index.ts` as the service entry point, currently a stub serving no routes
- `src/index.core.ts` binding the services the oracle runs on: the vault, the store read without transactions as
	`data-{branch}-oracle`, and Google AI
- `*.sys.md` system prompts next to the modules that use them; the first prompt also needs a `build` script that
	copies them into `lib`, as in `loader`

The package is wired into the repository like its siblings:

- the root `tsconfig.build.json` references its build
- `npm run serve -w packages/oracle` runs it locally in watch mode
- the `Dockerfile` builds its image with `--target oracle`
- `.github/workflows/deploy.yml` deploys it as `oracle-{branch}`, closed to unauthenticated callers
- `.claude/deployment.md` describes its service, identity and grants

The root `start` script does not run the oracle. Locally, both services default to port 8080, so set `PORT` when
running the oracle alongside the server.

# Open Decisions

- **Interface**: HTTP API, MCP server, chat UI, or a combination
- **Query strategy**: text-to-SPARQL, tool calls over `store.lookup()` models, or both
- **Model provider**: Gemini, as used by the loader, or another provider
- **Access**: which callers are granted access, how they authenticate, and the rate limits that bound model costs

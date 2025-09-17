This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

| Reference                             | Purpose                                                                |
|---------------------------------------|------------------------------------------------------------------------|
| @docs/guidelines/coding/java.md       | Standards for Java coding and Javadocs documentation                   |
| @docs/guidelines/coding/typescript.md | Standards for TypeScript coding and TypeDoc documentation              |
| @docs/guidelines/coding/markdown.md   | Standards for technical writing and structuring markdown documentation |
| @docs/guidelines/modelling.md         | Standards for documenting and structuring data models                  |
| @docs/guidelines/deploying.md         | Procedures for Google App Engine deployment                            |

## Guidelines Reference

- Use @ mentions for internal file references in Claude Code instructions (e.g., `@docs/guidelines/java.md`)

# Architecture Overview

## Hybrid Java/TypeScript Stack

This is a data-centric application with a Java backend serving both REST APIs and a React frontend. The build process
uses Maven to orchestrate both Java compilation and frontend bundling via the frontend-maven-plugin.

## Backend Architecture (Java)

- **Main entry**: `eu.ec2u.data.Data` class serves as the main server using the Metreeca Flow framework
- **Data processing**: `eu.ec2u.data.Boot` runs data ingestion pipelines for all datasets
- **Datasets**: Each dataset type (courses, events, documents, etc.) has its own package under `eu.ec2u.data.datasets`
- **RDF/Semantic Web**: Uses RDF4J for semantic data storage and SPARQL queries, connected to GraphDB

## Frontend Architecture (TypeScript/React)

- **Location**: Source in `src/main/typescript`, built assets served by Java server
- **Entry point**: `src/main/typescript/index.tsx`
- **Framework**: React with TypeScript, built using Vite
- **Styling**: CSS with PostCSS nesting plugin
- **API**: Consumes REST/JSON-LD APIs from the Java backend

## Key Dependencies

- **Backend**: Metreeca Flow framework, RDF4J, OpenAI Java client
- **Frontend**: React, @metreeca/view components, Vite
- **Database**: GraphDB (configured via environment variables)
- **Deployment**: Google App Engine

## Configuration

- **Maven properties**: Java 21, Node 22.14.0, npm 11.2.0
- **Environment**: Production detection via Google App Engine environment
- **Secrets**: GraphDB credentials, OpenAI API key, and sensitive parameters for accessing data sources stored in
  Google Cloud Secret Manager

# Development

## Workflow

1. Java backend runs on port 8080 serving both API and static assets
2. During development, run `npm start` to start Vite dev server with API proxy
3. Frontend changes are hot-reloaded, backend changes require restart
4. Maven handles the full build including frontend bundling for production

## Backend Commands

- **Build**: `mvn compile` - Compiles Java sources and builds frontend assets
- **Test**: `mvn test` - Runs JUnit tests
- **Run locally**: `java -cp target/classes:target/libs/* eu.ec2u.data.Data` - Starts the server on localhost:8080
- **Data processing**: `java -cp target/classes:target/libs/* eu.ec2u.data.Boot` - Runs all dataset processing pipelines
- **Clean**: `mvn clean` - Removes target directory and node_modules

## Frontend Commands

- **Start dev server**: `npm start` - Starts Vite dev server with hot reload (proxies API calls to localhost:8080)
- **Build**: `npm run build` - Builds optimized frontend assets
- **Install dependencies**: `npm install`

## Deployment Commands

- **Deploy**: `mvn appengine:deploy` - Deploys to Google App Engine
- **Deploy with staging**: `mvn compile appengine:deploy -Dgae.version=staging -Dgae.promote=false`

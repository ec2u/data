This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Development Commands

## Java Backend

- **Build**: `mvn compile` - Compiles Java sources and builds frontend assets
- **Test**: `mvn test` - Runs JUnit tests
- **Run locally**: `java -cp target/classes:target/libs/* eu.ec2u.data.Data` - Starts the server on localhost:8080
- **Data processing**: `java -cp target/classes:target/libs/* eu.ec2u.data.Boot` - Runs all dataset processing pipelines
- **Clean**: `mvn clean` - Removes target directory and node_modules

## Frontend Development

- **Start dev server**: `npm start` - Starts Vite dev server with hot reload (proxies API calls to localhost:8080)
- **Build**: `npm run build` - Builds optimized frontend assets
- **Install dependencies**: `npm install`

## Google App Engine Deployment

- **Deploy**: `mvn appengine:deploy` - Deploys to Google App Engine
- **Deploy with staging**: `mvn compile appengine:deploy -Dgae.version=staging -Dgae.promote=false`

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

## Data Model

- **Vocabularies**: Uses standard vocabularies (Schema.org, FOAF, SKOS, W3C Organization Ontology) defined in
  `src/main/java/eu/ec2u/data/vocabularies`
- **Datasets**: Structured data about EC2U universities including courses, events, documents, organizations, persons,
  programs, taxonomies, and units
- **Cross-linking**: All datasets are semantically linked and support faceted search

## Key Dependencies

- **Backend**: Metreeca Flow framework, RDF4J, OpenAI Java client
- **Frontend**: React, @metreeca/view components, Vite
- **Database**: GraphDB (configured via environment variables)
- **Deployment**: Google App Engine

## Development Workflow

1. Java backend runs on port 8080 serving both API and static assets
2. During development, run `npm start` to start Vite dev server with API proxy
3. Frontend changes are hot-reloaded, backend changes require restart
4. Maven handles the full build including frontend bundling for production

## Configuration

- **Maven properties**: Java 21, Node 22.14.0, npm 11.2.0
- **Environment**: Production detection via Google App Engine environment
- **Secrets**: GraphDB credentials and OpenAI API key stored in Google Cloud Secret Manager

# Code Style Guidelines

- Java code follows standard Java conventions
- Follow existing patterns for nested test classes with `@Nested` annotation
- Follow existing patterns for property naming in bean interfaces
- Imports: static imports for factory methods and constants
- Error handling: use checked exceptions with functional interfaces
- Naming: PascalCase for classes, camelCase for methods and variables
- Documentation: use Javadoc for public APIs
- Use final liberally for immutability

# Javadocs Guidelines

- Place Javadoc immediately before the documented element
- Use Javadoc only for public APIs unless required to do otherwise
- Introduce the class with a concise definition and a brief description of its purpose; keep the definition as short as
  possible
- Introduce boolean methods with "Checks if"
- Introduce read accessors with "Retrieves"
- Introduce write accessors with "Configures"
- Report unexpected null values as "@throws NullPointerException if <param> is {@code null}"; if two parameters are
  to be reported use "if either <param1> or <param2> is {@code null}"; if multiple parameters are to be reported use
  "if any of <param1>, <param2>, ..., <paramN> is {@code null}"
- Document record parameters with @param tags in the class description
- Definitely don't generate example usage sections
- Don't generate javadocs for overridden methods

# Data Model Guidelines

Data models are described by markdown files in the @src/main/static/datasets/ and
@src/main/static/handbooks/vocabularies folders; each document:

- has a brief summary of the vocabulary after the yaml front matter section, cross-linked to overview reference
  documents for the vocabularies in use
- entities and their properties are described in a tabular format
    - entities and properties have a description, cross-linked as required
    - properties are described wrt to the object being defined (eg the name of the person)
    - property names are properly cross-linked to their definitions either in the data model documents or in the
      vocabulary standard document
    - references to other entities are introduced as  "link to …" or “links to …” according to the cardinality of the
      property
  - descriptions are concise, neutral and technical in tone
    - existing descriptions are revises for completeness, correctness and consistency, but not otherwise replaced
- property definitions are consistent wrt to the authoritative definitions in the @src/main/java/eu/ec2u/data/datasets/
  and @src/main/java/eu/ec2u/data/vocabularies packages and subpackages
- cross-links are checked for completeness and correctness
    - links to locally defined well-known vocabularies, wherever available, are preferred; links to online standard
      reference documents are used otherwise
    - references to property definitions are linked using the proper anchor in the target document

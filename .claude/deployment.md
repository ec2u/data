---
title: Deployment
summary: The Google Cloud and GraphDB resources the pipe services run on, and the state each one is in
description: Reference for the deployment architecture, naming every resource, its role, its access grants and whether it exists yet.
---

# Overview

The pipe runs as three **Cloud Run** services per environment in the Google Cloud project `ec2u-data` (number
`891057038566`), region `europe-west1`. GitHub Actions deploys all of them in a single workflow run on every push to the
branch of the environment (`.github/workflows/deploy.yml`).

| Environment | Branch | Server        | Loader        | Oracle        | GraphDB repository | GraphDB users              |
|-------------|--------|---------------|---------------|---------------|--------------------|----------------------------|
| production  | `main` | `server-main` | `loader-main` | `oracle-main` | `data-main`        | `data-main-{service}`      |
| staging     | `next` | `server-next` | `loader-next` | `oracle-next` | `data-next`        | `data-next-{service}`      |
| development | `yard` | `server-yard` | `loader-yard` | `oracle-yard` | `data-yard`        | `data-yard-{service}`      |

- **Server**: serves the data endpoints and the web UI, open to the public
- **Loader**: runs the ingestion pipes, closed to every caller except Cloud Scheduler jobs signed as `scheduler`
- **Oracle**: answers natural language queries over the graph, closed to every caller except those granted access

Each environment is isolated: its services run under their own service accounts, read only the secrets of their
environment, and reach only their own GraphDB repository. Within an environment, each service has its own GraphDB
user and its own credentials, and only the loader can write.

# Environment

The workflow names the environment in the `PIPE_ENVIRONMENT` variable of every service. Each service derives its
resources from it, binding them in its own `src/index.core.ts`:

- GraphDB repository `data-{environment}` on `https://graphdb.ec2u.net`
- Secret Manager secrets `{environment}-gdb-{service}-usr` and `{environment}-gdb-{service}-pwd`, holding the
  credentials of the GraphDB user `data-{environment}-{service}`
- Secret Manager secret `{environment}-googleai-key`, for the loader and the oracle

The server and the oracle read the repository without opening transactions, since GraphDB grants transactions only to
users with write access.

Local runs default to `yard` and reach the same resources through the `gcloud` credentials the developer sets up with
`sh package.sh`. Set `PIPE_ENVIRONMENT` to run against another environment, picking the resources they read and write.

# Resources

## Google Cloud

| Resource                 | Name                                                         | Role                                                  |
|--------------------------|--------------------------------------------------------------|-------------------------------------------------------|
| Cloud Run services       | `server-{branch}`, `loader-{branch}`, `oracle-{branch}`      | Created and updated by the workflow                   |
| Artifact Registry        | `pipe`, Docker format, one image per service and environment | Holds the images; keeps the last two of each          |
| Runtime service accounts | `server-{branch}`, `loader-{branch}`, `oracle-{branch}`      | Identities the services run as                        |
| Scheduler service account | `scheduler`                                                 | Identity Cloud Scheduler jobs sign their calls with   |
| Deployer service account | `pipe-deployer`                                              | Identity the workflow deploys as                      |
| Workload Identity pool   | `github`, OIDC provider `ec2u`, restricted to owner `ec2u`   | Lets the workflow sign in without a service account key |
| Secrets                  | `{branch}-gdb-{service}-usr`, `{branch}-gdb-{service}-pwd`, `{branch}-googleai-key` | Credentials of each environment and service |

Enabled APIs: Cloud Run, Artifact Registry, Secret Manager, Cloud Scheduler, IAM, IAM Credentials, Security Token
Service, Cloud Resource Manager.

The registry cleanup policy keeps the two most recent versions of each image and deletes the others. The workflow
also deletes every Cloud Run revision except the one serving traffic.

## Access Grants

| Principal                      | Role                                 | On                                                       |
|--------------------------------|--------------------------------------|----------------------------------------------------------|
| `{service}-{branch}`           | `roles/secretmanager.secretAccessor` | the project, conditioned on secret names starting with `{branch}-gdb-{service}-` or equal to `{branch}-googleai-key` |
| `scheduler`                    | `roles/run.invoker`                  | `loader-{branch}`, granted once the first deployment has created it |
| oracle callers (to be defined) | `roles/run.invoker`                  | `oracle-{branch}`, granted once the first deployment has created it |
| `pipe-deployer`                | `roles/run.admin`                    | the project                                              |
| `pipe-deployer`                | `roles/artifactregistry.writer`      | the `pipe` registry                                      |
| `pipe-deployer`                | `roles/iam.serviceAccountUser`       | each runtime service account                             |
| GitHub repository `ec2u/pipe`  | `roles/iam.workloadIdentityUser`     | `pipe-deployer`, through the `github` pool               |

## GraphDB

Each environment has a repository `data-{branch}`, configured as `data-work`, and one user per service, granted access
to that repository alone:

- `data-{branch}-loader`: read and write
- `data-{branch}-server`: read only
- `data-{branch}-oracle`: read only

Passwords follow the macOS generated format (`xxxxxx-xxxxxx-xxxxxx`). The admin password is held in the
`gdb-admin-pwd` secret.

## Scheduled Jobs

The loader exposes one endpoint per pipe, answering `POST` only. Each Cloud Scheduler job targets one endpoint with an
OIDC token minted as `scheduler@ec2u-data.iam.gserviceaccount.com`, with the default audience (the endpoint URL) and an
attempt deadline of at most 30 minutes, matching the request timeout of the loader.

# Current State

| Resource                                   | `main`                 | `next`                 | `yard`  |
|--------------------------------------------|------------------------|------------------------|---------|
| Secrets                                    | missing                | missing                | created, one pair per service |
| GraphDB repository                         | exists                 | exists                 | created, copied from `data-work` |
| GraphDB users                              | shared `data-server`   | shared `data-server`   | created, one per service |
| Service accounts, registry, Workload Identity | missing             | missing                | missing |
| Cloud Run services, scheduled jobs         | missing                | missing                | missing |

Until the shared resources exist, a push to `main`, `next` or `yard` fails at the sign-in step of the workflow. The
legacy secrets (`gdb-server-usr`, `gdb-server-pwd`, `googleai-key`) and the shared GraphDB user `data-server` stay in
place until `main` and `next` move to their own.

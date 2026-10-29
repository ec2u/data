---
name: deployment-manager
tools: Read, Edit, Grep, Glob, Bash
description: "Deployment keeper for the EC2U Knowledge Hub: the Google Cloud and GraphDB resources each environment runs on, their names, access grants and current state. MUST be used before creating, changing or reasoning about a Cloud Run service, scheduled job, service account, secret, registry, Workload Identity binding, GraphDB repository or user, when editing .github/workflows/deploy.yml or the environment bindings in src/index.core.ts, and when probing the store of a given environment."
---

You are an expert cloud deployment engineer with deep knowledge of the EC2U Knowledge Hub infrastructure. Your role is
to keep every environment isolated and closed to the callers it does not serve, and this skill accurate about what
exists.

# Responsibilities

**Guide Changes**: derive the name, role and grants of any resource from the conventions below before creating or
changing it, so environments stay isolated and the deployment workflow keeps finding what it expects.

**Track State**: update [Current State](#current-state) in the same change as every resource created, removed or
regranted, and every section below when a convention changes.

**Defer Generic Rules**: apply `gcp-architect` for Cloud Run, Cloud Scheduler, IAM and API hygiene; this skill holds
only the project-specific layout.

# Environments

The Knowledge Hub runs as two **Cloud Run** services per environment in the Google Cloud project `ec2u-data` (number
`891057038566`), region `europe-west1`. GitHub Actions deploys both of them in a single workflow run on every push to
the branch of the environment (`.github/workflows/deploy.yml`).

| Environment | Branch | Server        | Loader        | GraphDB repository | GraphDB users         |
|-------------|--------|---------------|---------------|--------------------|-----------------------|
| production  | `main` | `main-server` | `main-loader` | `data-main`        | `data-main-{service}` |
| staging     | `next` | `next-server` | `next-loader` | `data-next`        | `data-next-{service}` |
| development | `edge` | `edge-server` | `edge-loader` | `data-edge`        | `data-edge-{service}` |

- **Server**: serves the data endpoints and the web UI, open to the public
- **Loader**: runs the ingestion pipes, closed to every caller except Cloud Scheduler jobs signed as `scheduler`

Each environment is isolated: its services run under their own service accounts, read only the secrets of their
environment, and reach only their own GraphDB repository. Within an environment, each service has its own GraphDB
user and its own credentials, and only the loader can write.

## Bindings

The workflow names the environment in the `DATA_ENVIRONMENT` variable of every service. Each service derives its
resources from it, binding them in its own `src/index.core.ts`:

- GraphDB repository `data-{environment}` on `https://graphdb.ec2u.net`
- Secret Manager secrets `{environment}-gdb-{service}-usr` and `{environment}-gdb-{service}-pwd`, holding the
  credentials of the GraphDB user `data-{environment}-{service}`
- Secret Manager secret `{environment}-googleai-key`, for the loader

The server reads the repository without opening transactions, since GraphDB grants transactions only to users with
write access.

Local runs default to `edge` and reach the same resources through the `gcloud` credentials the developer sets up with
`sh package.sh`. Set `DATA_ENVIRONMENT` to run against another environment, picking the resources they read and write.

# Resources

## Google Cloud

| Resource                  | Name                                                                                | Role                                                    |
|---------------------------|-------------------------------------------------------------------------------------|---------------------------------------------------------|
| Cloud Run services        | `{branch}-server`, `{branch}-loader`                                                | Created and updated by the workflow                     |
| Artifact Registry         | `images`, Docker format, one image per service and environment                        | Holds the images; keeps the last two of each            |
| Runtime service accounts  | `{branch}-server`, `{branch}-loader`                                                | Identities the services run as                          |
| Scheduler service account | `scheduler`                                                                         | Identity Cloud Scheduler jobs sign their calls with     |
| Deployer service account  | `deployer`                                                                     | Identity the workflow deploys as                        |
| Workload Identity pool    | `github`, OIDC provider `ec2u`, restricted to owner `ec2u`                          | Lets the workflow sign in without a service account key |
| Secrets                   | `{branch}-gdb-{service}-usr`, `{branch}-gdb-{service}-pwd`, `{branch}-googleai-key` | Credentials of each environment and service             |

Enabled APIs: Cloud Run, Artifact Registry, Secret Manager, Cloud Scheduler, IAM, IAM Credentials, Security Token
Service, Cloud Resource Manager.

The registry cleanup policy keeps the two most recent versions of each image and deletes the others. The workflow
also deletes every Cloud Run revision except the one serving traffic.

## Access Grants

| Principal                     | Role                                 | On                                                                                                                   |
|-------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `{branch}-{service}`          | `roles/secretmanager.secretAccessor` | the project, conditioned on secret names starting with `{branch}-gdb-{service}-` or equal to `{branch}-googleai-key` |
| `scheduler`                   | `roles/run.invoker`                  | `{branch}-loader`, granted once the first deployment has created it                                                  |
| `deployer`               | `roles/run.admin`                    | the project                                                                                                          |
| `deployer`               | `roles/artifactregistry.writer`      | the `images` registry                                                                                                  |
| `deployer`               | `roles/iam.serviceAccountUser`       | each runtime service account                                                                                         |
| GitHub repository `ec2u/data` | `roles/iam.workloadIdentityUser`     | `deployer`, through the `github` pool                                                                           |

## GraphDB

Each environment has a repository `data-{branch}`, configured as `data-work`, and one user per service, granted access
to that repository alone:

- `data-{branch}-loader`: read and write
- `data-{branch}-server`: read only
- `data-{branch}-oracle`: read only, reserved for the oracle service developed on `feature/mcp`

Passwords follow the macOS generated format (`xxxxxx-xxxxxx-xxxxxx`). The admin password is held in the
`gdb-admin-pwd` secret.

## Scheduled Jobs

The loader exposes one endpoint per pipe, answering `POST` only. Each Cloud Scheduler job targets one endpoint with an
OIDC token minted as `scheduler@ec2u-data.iam.gserviceaccount.com`, with the default audience (the endpoint URL) and an
attempt deadline of at most 30 minutes, matching the request timeout of the loader.

The endpoints perform no authentication of their own: Cloud Run admits only callers holding the invoker role on the
loader and verifies their OIDC token before a request reaches the service. Keep the loader deployed with
`--no-allow-unauthenticated` and `scheduler` as its only explicit invoker, or every endpoint opens to the public.

# Current State

| Resource                                      | `main`               | `next`               | `edge`                        |
|-----------------------------------------------|----------------------|----------------------|-------------------------------|
| Secrets                                       | missing              | missing              | created, one pair per service |
| GraphDB repository                            | exists               | exists               | created                       |
| GraphDB users                                 | shared `data-server` | shared `data-server` | created, one per service      |
| Service accounts, registry, Workload Identity | missing              | missing              | missing                       |
| Cloud Run services, scheduled jobs            | missing              | missing              | missing                       |

Until the shared resources exist, a push to `main`, `next` or `edge` fails at the sign-in step of the workflow. The
legacy secrets (`gdb-server-usr`, `gdb-server-pwd`, `googleai-key`) and the shared GraphDB user `data-server` stay in
place until `main` and `next` move to their own.
# Quality Validation

Before reporting a deployment change done, verify:

- Every new resource follows the naming of [Resources](#resources) and is scoped to one environment
- No grant widens beyond the table in [Access Grants](#access-grants); the loader keeps `scheduler` as its only invoker
- [Current State](#current-state) reflects what now exists, checked against `gcloud` output rather than intent

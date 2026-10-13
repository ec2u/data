---
title: Deployment
summary: How the pipe services run on Google Cloud and how to set up and operate an environment
---

# Overview

The pipe runs as two **Cloud Run** services per environment in the Google Cloud project `ec2u-data`, region
`europe-west1`, both deployed by GitHub Actions in a single workflow run on every push to the branch of that
environment.

| Service           | Role                                                                                           |
|-------------------|------------------------------------------------------------------------------------------------|
| `server-{branch}` | Serves the data endpoints and the web UI, open to the public                                   |
| `loader-{branch}` | Runs the ingestion pipes, closed to every caller but Cloud Scheduler jobs signed as `scheduler` |

| Environment | Branch | Services                        | Images                          |
|-------------|--------|---------------------------------|---------------------------------|
| production  | `main` | `server-main`, `loader-main`    | `server-main`, `loader-main`    |
| staging     | `next` | `server-next`, `loader-next`    | `server-next`, `loader-next`    |
| development | `yard` | `server-yard`, `loader-yard`    | `server-yard`, `loader-yard`    |

Both images are built from the root `Dockerfile`, selecting the service with `--target server|loader`.

The workflow names the environment in the `PIPE_ENVIRONMENT` variable of both services, and the services derive their
resources from it: the GraphDB repository `data-{environment}` and the Secret Manager secrets
`{environment}-gdb-server-usr`, `{environment}-gdb-server-pwd` and `{environment}-googleai-key`. Local runs default to
`yard`.

# Setup

Nothing is provisioned yet. To set up an environment, replace `<branch>` with `main`, `next` or `yard`:

1. Run `npm run prime`, which signs `gcloud` in and points it at the project
1. Run `sh deploy/provision.sh <branch>`: enables the APIs and creates the registry, the empty secrets of the
   environment, the runtime, scheduler and deployer service accounts and the Workload Identity binding for GitHub
   repository `ec2u/pipe`
1. `sh deploy/secrets.sh <branch> gdb`: prompts for the GraphDB user of the environment (`data-<branch>` by default)
   and a new password for it, and loads them
1. `sh deploy/secrets.sh <branch> googleai`: prompts for the Google AI API key of the environment and loads it
1. `sh deploy/graphdb.sh <branch>`: creates the GraphDB repository `data-<branch>`, configured as `data-work`, and the
   user just loaded, with read and write access to that repository alone
1. Push the branch: the workflow in `.github/workflows/deploy.yml` builds both images, pushes them to the `pipe`
   registry and creates or updates both services
1. Run `sh deploy/provision.sh <branch>` again: now that the loader exists, it admits the `scheduler` service account as
   its only invoker

Local runs need steps 1 to 5 for `yard` (or the environment named in `PIPE_ENVIRONMENT`) and nothing else: they read
the same secrets and repository as the deployed services, through the `gcloud` credentials of the developer.

Cloud Scheduler jobs are not created by these scripts: each job must `POST` to its loader endpoint with an OIDC token
minted as `scheduler@ec2u-data.iam.gserviceaccount.com`, with an attempt deadline of at most 30 minutes.

# Operations

- **Deploy**: every push to `main`, `next` or `yard` deploys both services of that environment; deployments of the
  same environment run one at a time. To redeploy a commit, re-run its workflow run from the Actions tab
- **Clean up**: the workflow deletes every revision except the serving one, and the registry keeps the last two images
  of each service (`deploy/cleanup.json`)
- **Logs**: `gcloud run services logs read server-main --region europe-west1 --limit 100`

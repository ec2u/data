#!/bin/sh
#
# Copyright © 2020-2026 EC2U Alliance
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Creates every Google Cloud resource a pipe environment needs, together with the resources all environments share,
# in the project gcloud is configured for (see <npm run prime>). Safe to run again: existing resources are left as they
# are and only missing ones are created.
#
# usage: sh deploy/provision.sh main|next|yard
#
# The argument names the branch the environment deploys from (see <deploy/README.md>). The Cloud Run services
# themselves are created by the first deployment from GitHub Actions (see <.github/workflows/deploy.yml>): run the
# script again after it to admit the scheduler to the loader.

set -eu

case "${1:-}" in
	main|next|yard) branch=$1 ;;
	*) echo "usage: sh deploy/provision.sh main|next|yard" >&2; exit 1 ;;
esac

project=ec2u-data
number=891057038566
region=europe-west1
repository=ec2u/pipe

registry=pipe
server=server-${branch}
loader=loader-${branch}
deployer=pipe-deployer@${project}.iam.gserviceaccount.com
scheduler=scheduler@${project}.iam.gserviceaccount.com


# Retries an IAM binding until the account it names has propagated (creation is eventually consistent)

bind() {
	for attempt in 1 2 3 4 5 6; do
		if "$@" >/dev/null 2>&1; then return 0; else sleep 10; fi
	done
	"$@" >/dev/null
}

exists() {
	"$@" >/dev/null 2>&1
}


# APIs

gcloud services enable \
	run.googleapis.com \
	artifactregistry.googleapis.com \
	secretmanager.googleapis.com \
	cloudscheduler.googleapis.com \
	iam.googleapis.com \
	iamcredentials.googleapis.com \
	sts.googleapis.com \
	cloudresourcemanager.googleapis.com \
	--project "${project}"


# Container registry, with a cleanup policy keeping the last two images

exists gcloud artifacts repositories describe "${registry}" --location="${region}" --project "${project}" \
	|| gcloud artifacts repositories create "${registry}" \
		--repository-format=docker --location="${region}" --project "${project}" \
		--description="Pipe container images"

gcloud artifacts repositories set-cleanup-policies "${registry}" \
	--location="${region}" --project "${project}" \
	--policy="$(dirname "$0")/cleanup.json" --no-dry-run


# Runtime service accounts: read the secrets of their environment, nothing else

for service in "${server}" "${loader}"; do

	exists gcloud iam service-accounts describe "${service}@${project}.iam.gserviceaccount.com" --project "${project}" \
		|| gcloud iam service-accounts create "${service}" --display-name="Pipe ${service}" --project "${project}"

	bind gcloud projects add-iam-policy-binding "${project}" \
		--member="serviceAccount:${service}@${project}.iam.gserviceaccount.com" \
		--role=roles/secretmanager.secretAccessor \
		--condition="title=${branch}-secrets,expression=resource.name.startsWith('projects/${number}/secrets/${branch}-')"

done


# Secrets, created empty: load them with gcloud secrets versions add

for secret in gdb-server-usr gdb-server-pwd googleai-key; do

	exists gcloud secrets describe "${branch}-${secret}" --project "${project}" \
		|| gcloud secrets create "${branch}-${secret}" --replication-policy=automatic --project "${project}"

done


# Scheduler service account: the only caller the loader admits (see <packages/_/src/gear-gcp/_scheduler.ts>)

exists gcloud iam service-accounts describe "${scheduler}" --project "${project}" \
	|| gcloud iam service-accounts create scheduler --display-name="Cloud Scheduler" --project "${project}"


# Deployer service account, used by GitHub Actions through Workload Identity Federation (no key is ever issued)

exists gcloud iam service-accounts describe "${deployer}" --project "${project}" \
	|| gcloud iam service-accounts create pipe-deployer --display-name="Pipe deployer" --project "${project}"

bind gcloud projects add-iam-policy-binding "${project}" \
	--member="serviceAccount:${deployer}" --role=roles/run.admin --condition=None

bind gcloud artifacts repositories add-iam-policy-binding "${registry}" \
	--location="${region}" --project "${project}" \
	--member="serviceAccount:${deployer}" --role=roles/artifactregistry.writer

for service in "${server}" "${loader}"; do

	bind gcloud iam service-accounts add-iam-policy-binding "${service}@${project}.iam.gserviceaccount.com" \
		--project "${project}" --member="serviceAccount:${deployer}" --role=roles/iam.serviceAccountUser

done

exists gcloud iam workload-identity-pools describe github --location=global --project "${project}" \
	|| gcloud iam workload-identity-pools create github \
		--location=global --display-name="GitHub Actions" --project "${project}"

exists gcloud iam workload-identity-pools providers describe ec2u \
		--workload-identity-pool=github --location=global --project "${project}" \
	|| gcloud iam workload-identity-pools providers create-oidc ec2u \
		--location=global --workload-identity-pool=github --project "${project}" \
		--display-name="ec2u organisation" \
		--issuer-uri="https://token.actions.githubusercontent.com" \
		--attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
		--attribute-condition="assertion.repository_owner == 'ec2u'"

bind gcloud iam service-accounts add-iam-policy-binding "${deployer}" \
	--project "${project}" --role=roles/iam.workloadIdentityUser \
	--member="principalSet://iam.googleapis.com/projects/${number}/locations/global/workloadIdentityPools/github/attribute.repository/${repository}"


# Loader invoker, granted once the first deployment has created the service

if exists gcloud run services describe "${loader}" --region="${region}" --project "${project}"; then

	bind gcloud run services add-iam-policy-binding "${loader}" \
		--region="${region}" --project "${project}" \
		--member="serviceAccount:${scheduler}" --role=roles/run.invoker

fi

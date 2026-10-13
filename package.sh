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

project=ec2u-data

gcp() { # Configure GCP project for local testing

	gcloud auth print-access-token >/dev/null 2>&1 || gcloud auth login --update-adc
	gcloud auth application-default print-access-token >/dev/null 2>&1 || gcloud auth application-default login

	gcloud auth application-default set-quota-project ${project}
	gcloud config set project ${project}

}

link() { # Link local @metreeca packages, if checked out

	packages=${HOME}/Metreeca/Packages

	if [ -d "${packages}" ]; then

		npx link \
			${packages}/Blue \
			${packages}/Core \
			${packages}/Flow \
			${packages}/Gear/packages/gear \
			${packages}/HTTP \
			${packages}/Keep/packages/components/keep \
			${packages}/Keep/packages/connectors/keep-rest \
			${packages}/Keep/packages/connectors/keep-sparql \
			${packages}/MIME/packages/mime-csv \
			${packages}/MIME/packages/mime-json \
			${packages}/MIME/packages/mime-xml \
			${packages}/Pipe/packages/pipe-url \
			${packages}/Qest \
			${packages}/Tape \
			${packages}/Tile/packages/tile \
			${packages}/Tile/packages/tile-cell \
			${packages}/Tile/packages/tile-data \
			${packages}/Tile/packages/tile-hive \
			${packages}/Trio \
			${packages}/Wire/packages/sparql/wire-sparql \
			${packages}/Wire/packages/sparql/wire-sparql-http \
			${packages}/Wire/packages/sparql/wire-sparql-rdf4j

	fi

}

deploy() { # Deploy the loader to Cloud Run and schedule its jobs

	# The service is closed to the public: Cloud Run checks the OIDC token of each request and admits only callers
	# granted the invoker role. Jobs mint tokens as a dedicated service account, the only one granted that role, with
	# the default audience (the job URL), which the job endpoints verify again against the URL they are reached at.
	#
	# !!! requires a container build for packages/loader (Dockerfile or buildpacks entry point) before the first run

	region=europe-west3
	service=loader
	account=scheduler@${project}.iam.gserviceaccount.com
	schedule="0 3 * * *"

	jobs="
		universities/wikidata
		events/coimbra-university
		events/iasi-university-360
		events/jena-university
		events/linz-university
		events/pavia-university
		events/poitiers-university
		events/salamanca-university
		events/turku-university
		events/umea-university
	"

	gcloud iam service-accounts describe ${account} >/dev/null 2>&1 \
		|| gcloud iam service-accounts create scheduler --display-name="Cloud Scheduler"

	gcloud run deploy ${service} \
		--region=${region} \
		--source=. \
		--no-allow-unauthenticated

	gcloud run services add-iam-policy-binding ${service} \
		--region=${region} \
		--member="serviceAccount:${account}" \
		--role="roles/run.invoker"

	url=$(gcloud run services describe ${service} --region=${region} --format="value(status.url)")

	for job in ${jobs}; do

		name=$(echo ${job} | tr "/" "-")

		gcloud scheduler jobs describe ${name} --location=${region} >/dev/null 2>&1 \
			&& action=update \
			|| action=create

		gcloud scheduler jobs ${action} http ${name} \
			--location=${region} \
			--schedule="${schedule}" \
			--time-zone="Europe/Rome" \
			--uri="${url}/${job}" \
			--http-method=POST \
			--attempt-deadline=30m \
			--oidc-service-account-email=${account}

	done

}


########################################################################################################################

case "$*" in

	"") ;;

	"gcp") gcp ;;
	"link") link ;;
	"deploy") deploy ;;

	*) echo "unsupported options <$*>" >&2; exit 1 ;;

esac

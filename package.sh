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

# Select actions: the caller names the actions it needs, so an empty command line is a direct execution

gcp=
link=

case "$*" in

	"--gcp") gcp=1 ;;
	"--link") link=1 ;;
	"--gcp --link" | "--link --gcp") gcp=1; link=1 ;;

	"") echo "package.sh is a project task and is not meant to be run on its own" >&2; exit 1 ;;

	*) echo "unsupported options <$*>" >&2; exit 1 ;;

esac


# Configure GCP project for local testing

project=ec2u-data

if [ -n "${gcp}" ]; then

	gcloud auth print-access-token >/dev/null 2>&1 || gcloud auth login --update-adc
	gcloud auth application-default print-access-token >/dev/null 2>&1 || gcloud auth application-default login

	gcloud auth application-default set-quota-project ${project}
	gcloud config set project ${project}

fi


# Link local @metreeca packages, if checked out

packages=${HOME}/Metreeca/Packages

if [ -n "${link}" ] && [ -d "${packages}" ]; then

	npx link \
		${packages}/Blue \
		${packages}/Core \
		${packages}/Flow \
		${packages}/Gear/packages/gear \
		${packages}/Gear/packages/gear-csv \
		${packages}/Gear/packages/gear-json \
		${packages}/Gear/packages/gear-url \
		${packages}/Gear/packages/gear-xml \
		${packages}/HTTP \
		${packages}/Keep/packages/components/keep \
		${packages}/Keep/packages/connectors/keep-sparql \
		${packages}/Qest \
		${packages}/Tape \
		${packages}/Trio \
		${packages}/Wire/packages/sparql/wire-sparql \
		${packages}/Wire/packages/sparql/wire-sparql-http \
		${packages}/Wire/packages/sparql/wire-sparql-rdf4j

fi

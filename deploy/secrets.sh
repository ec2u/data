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
# Loads the secrets the pipe services read from Secret Manager (see <deploy/README.md> for when to run each action).
#
# usage: sh deploy/secrets.sh <branch> gdb       load the GraphDB username and password, prompted for
#        sh deploy/secrets.sh <branch> googleai  load the Google AI API key, prompted for
#
# <branch> is main, next or yard, and names the environment whose secrets are loaded (see <deploy/README.md>).
#
# Each action adds a new version of the secrets it touches and destroys the previous ones; the services read the
# latest version, and running instances keep the values they started with until they are replaced.

set -eu

usage="usage: sh deploy/secrets.sh main|next|yard gdb | googleai"

case "${1:-}" in
	main|next|yard) branch=$1; shift ;;
	*) echo "${usage}" >&2; exit 1 ;;
esac

project=ec2u-data

add() {

	version=$(gcloud secrets versions add "${branch}-$1" --data-file="$2" --project "${project}" \
		--format="value(name.basename())")

	gcloud secrets versions list "${branch}-$1" --project "${project}" --filter="state=ENABLED OR state=DISABLED" \
		--format="value(name.basename())" | while read -r old; do

		[ "${old}" = "${version}" ] \
			|| gcloud secrets versions destroy "${old}" --secret="${branch}-$1" --project "${project}" --quiet

	done
}

prompt() {

	printf "%s: " "$1" >&2
	stty -echo
	read -r value
	stty echo
	printf "\n" >&2

	printf "%s" "${value}"
}

case "${1:-}" in

	gdb)

		printf "GraphDB username [data-%s]: " "${branch}" >&2
		read -r usr

		printf "%s" "${usr:-data-${branch}}" | add gdb-server-usr -
		prompt "GraphDB password" | add gdb-server-pwd -

		;;

	googleai)

		prompt "Google AI API key" | add googleai-key -

		;;

	*)

		echo "${usage}" >&2
		exit 1

		;;

esac

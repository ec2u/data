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
# Creates the GraphDB repository and user of a pipe environment. Safe to run again: an existing repository or user is
# left as it is.
#
# usage: sh deploy/graphdb.sh main|next|yard
#
# The repository data-<branch> is configured as data-work. The user is the one named in the <branch>-gdb-server-usr
# secret, with the password in <branch>-gdb-server-pwd (load both first with <deploy/secrets.sh>), and is granted read
# and write access to that repository alone. The GraphDB admin password is read from the gdb-admin-pwd secret.

set -eu

case "${1:-}" in
	main|next|yard) branch=$1 ;;
	*) echo "usage: sh deploy/graphdb.sh main|next|yard" >&2; exit 1 ;;
esac

project=ec2u-data
server=https://graphdb.ec2u.net
template=data-work
repository=data-${branch}

secret() {
	gcloud secrets versions access latest --secret="$1" --project "${project}"
}

GDB_ADMIN=$(secret gdb-admin-pwd)
GDB_USR=$(secret "${branch}-gdb-server-usr")
GDB_PWD=$(secret "${branch}-gdb-server-pwd")

export GDB_ADMIN GDB_USR GDB_PWD

gdb() { # method path [body]
	curl -sS --fail-with-body --max-time 60 -u "admin:${GDB_ADMIN}" -X "$1" \
		-H "Accept: application/json, */*" -H "Content-Type: application/json" \
		${3:+--data-binary "$3"} "${server}$2"
}

exists() {
	curl -sS -o /dev/null -w "%{http_code}" --max-time 60 -u "admin:${GDB_ADMIN}" "${server}$1" | grep -qx 200
}


# Repository, configured as the template

exists "/rest/repositories/${repository}" || gdb POST /rest/repositories "$(gdb GET "/rest/repositories/${template}" \
	| node -e '
		const config = JSON.parse(require("fs").readFileSync(0, "utf8"));
		process.stdout.write(JSON.stringify({
			...config,
			id: process.argv[1],
			title: `data.ec2u.eu ${process.argv[2]} database`
		}));
	' "${repository}" "${branch}")"


# User, granted access to the repository alone

exists "/rest/security/users/${GDB_USR}" || gdb POST "/rest/security/users/${GDB_USR}" "$(node -e '
	process.stdout.write(JSON.stringify({
		password: process.env.GDB_PWD,
		grantedAuthorities: ["ROLE_USER", `READ_REPO_${process.argv[1]}`, `WRITE_REPO_${process.argv[1]}`]
	}));
' "${repository}")"

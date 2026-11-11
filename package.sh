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

# Configure GCP project for local testing

project=ec2u-data

gcloud auth print-access-token >/dev/null 2>&1 &&
	gcloud auth application-default print-access-token >/dev/null 2>&1 ||
	gcloud auth login --update-adc

gcloud auth application-default set-quota-project ${project}

gcloud config set project ${project}
gcloud config set billing/quota_project ${project}

# !!! TEMPORARY NOTE (2026-11-11): drop once the reauthentication test below is settled
#
# Goal: stop the daily gcloud/ADC reauthentication forced by the metreeca.com Google Cloud session control
# policy (16h reauthentication, failing with "Reauthentication failed. cannot prompt during non-interactive
# execution").
#
# Admin console settings already in place:
# - API controls › App access control: Google Cloud SDK (32555940559.apps.googleusercontent.com) marked Trusted
# - Google Cloud session control: Require reauthentication every 16h, with Exempt trusted apps ticked
#
# Both gcloud and ADC sign in through that SDK client, so the exemption should apply to them.
#
# Test: fresh sign-in at 2026-11-11 09:40 CET, after revoking every earlier token.
# - `gcloud auth print-access-token` still working after 2026-11-12 01:40 CET means the exemption works
# - failing means checking the trusted entry access level (Trusted, not Limited), the org unit it is scoped to,
#   and whether a child org unit overrides Exempt trusted apps; fall back to moving the account to an org unit
#   set to Never require reauthentication
#
# Done the same day, nothing left to act on:
# - gcloud file logging disabled (core/disable_file_logging), since debug logs stored refresh tokens in plain
#   text; old logs deleted and the leaked tokens revoked
# - stale ec2u-data@appspot service account key c289ba33… deleted on GCP (IAM API enabled for that) and its local
#   copy removed; the alessandro.bollini@ec2u.cc credentials removed locally
#
# Still open: ec2u-data@appspot keeps Editor and Secret Accessor on ec2u-data (alessandro.bollini@ec2u.cc keeps
# Owner by design)

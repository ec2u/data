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

# !!! TEMPORARY NOTE (2026-11-12): drop once the reauthentication test is settled
#
# Daily gcloud/ADC reauthentication on metreeca.com accounts is handled at organisation level: members of
# gcp-devs@metreeca.com are exempt from Cloud SDK reauthentication; setup, test status and lessons are recorded in
# https://github.com/metreeca/gcp (verification due 2026-11-13 01:35 CET).

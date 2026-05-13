project=ec2u-data

gcloud auth application-default login
gcloud auth application-default set-quota-project ${project}
gcloud config set project ${project}
gcloud config set billing/quota_project ${project}

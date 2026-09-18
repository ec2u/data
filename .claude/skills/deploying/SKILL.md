---
name: deploying
description: Deploy the EC2U Knowledge Hub to Google App Engine. Use when deploying a new version, promoting or rolling back traffic, rebuilding the GraphDB repository, or when the user mentions App Engine, GAE, deploy, or bootstrap.
---

Deploy the Knowledge Hub to Google App Engine.

# Major Upgrade

1. Migrate traffic to an alternate version at the
   [App Engine versions console](https://console.cloud.google.com/appengine/versions?project=ec2u-data)
2. Delete the target version
3. Clear and rebuild the repository at https://graphdb.ec2u.net
4. Check the target version in `pom.xml` and `Data.java`
5. Run `Boot` to bootstrap the repository
6. Run the loaders, starting from the taxonomies so that cross-references resolve
7. Clean, then deploy the GAE version

# Commands

- **Deploy**: `mvn appengine:deploy`
- **Deploy to staging**: `mvn compile appengine:deploy -Dgae.version=staging -Dgae.promote=false`

---
title: Deployment Guidelines
summary: Procedures Google App Engine deployment
---

# Major Upgrade

- Migrate traffic to alternate version
  at [App Engine Versions Console](https://console.cloud.google.com/appengine/versions?project=ec2u-data)
- Delete target version
- Clear and rebuild repository at https://graphdb.ec2u.net
- Check target version:
  - `pom.xml`
  - `Data.java`
- Run Boot to bootstrap repository
- Run loaders:
  - Start from taxonomies to support cross-reference
- Deploy GAE version:
  - Clean
  - Deploy

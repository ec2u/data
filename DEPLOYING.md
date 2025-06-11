# Major Upgrade

* migrate traffic to alternate
  version @ https://console.cloud.google.com/appengine/versions?authuser=1&inv=1&invt=AbeYBQ&project=ec2u-data&supportedpurview=project&serviceId=default
* delete target version
* clear/rebuild repository @ http://base.ec2u.net/repository
* check target version
    * pom.xml
    * Data.java
* run Boot to bootstrap repository
* run loaders
    * start from taxonomies to support cross-reference
* deploy GAE version
    * clean
    * deploy

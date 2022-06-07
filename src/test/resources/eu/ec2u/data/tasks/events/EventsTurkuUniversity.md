# Site

* https://www.utu.fi/event-search
  * University of Turku / News
  * Turun yliopisto / Ajankohtaista

## API

* JSON
  * https://api-ext.utu.fi/events/v1/public
  * proxied version of the base IP-restricted API @ https://api.utu.fi/events/v1/public

# Integration

* custom adapter
* access key stored on GCP Secret Manager
* required contact address provided by MMT

## Pending

* review availability of image links

## 2022-06-07

* fix conflicting labels for online locations
  * generated when the same URL is used for multiple events, e.g. `https://utu.zoom.us/j/65956988902`

# Samples

```http
GET https://api-ext.utu.fi/events/v1/public
X-Api-Key: {{events-turku-university}}
```


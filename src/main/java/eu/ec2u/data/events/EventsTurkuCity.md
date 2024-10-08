# Site

* https://kalenteri.turku.fi/
  * City of Turku / Event's Calendar
  * Turun kaupunki / Tapahtumakalenteri

# API

* LinkedEvents
  * https://api.hel.fi/linkedevents/v1/event/

# Integration

* data synced using the LinkedEvents protocol
  * https://dev.hel.fi/apis/linkedevents
  * https://github.com/City-of-Helsinki/linkedevents

## Pending

- filter out immaterial events (e.g. children, …)

## 2024-04-08

* Restored using the new API @ https://api.hel.fi/linkedevents/v1/event/

## 2022-09-07

* Provisionally disabled feed as per https://github.com/ec2u/data/issues/36

## 2022-07-25

* FIx https://github.com/ec2u/data/issues/29 / Newlines are preserved in description (assuming no HTML markup)
* Fix https://github.com/ec2u/data/issues/24 / `info_url` is correctly mapped to `schema.url`
* Close https://github.com/ec2u/data/issues/13 / Integrate `location_extra_info` has fallback location info

## 2022-06-30

* Fix mapping of location addresses: now skolemized resources are generated only for non empty descriptions

# Samples

```http
GET https://linkedevents-api.turku.fi/v1/event/?last_modified_since=2022-03-01
```

```json
{
    "meta": {
        "count": 641,
        "next": "https://linkedevents-api.turku.fi/v1/event/?last_modified_since=2022-05-15&page=2",
        "previous": null
    },
    "data": [
        {
            "id": "turku:991417",
            "location": null,
            "keywords": [ ],
            "super_event": {
                "@id": "https://linkedevents-api.turku.fi/v1/event/turku:991415/"
            },
            "event_status": "EventRescheduled",
            "type_id": "Hobbies",
            "external_links": [ ],
            "offers": [
                {
                    "payment_methods": [ ],
                    "is_free": false,
                    "description": null,
                    "price": {
                        "fi": "<p>Sisäänpääsymaksu + ohjausmaksu 2,50 €</p>"
                    },
                    "info_url": null
                }
            ],
            "data_source": "turku",
            "publisher": "turku:853",
            "sub_events": [ ],
            "images": [ ],
            "videos": [ ],
            "in_language": [
                {
                    "@id": "https://linkedevents-api.turku.fi/v1/language/fi/"
                }
            ],
            "audience": [ ],
            "created_time": "2022-05-18T12:00:17.744986Z",
            "last_modified_time": "2022-05-20T07:30:29.200452Z",
            "date_published": "2022-06-07T16:30:00Z",
            "start_time": "2022-06-14T16:30:00Z",
            "end_time": "2022-06-14T17:15:00Z",
            "is_virtualevent": false,
            "is_owner": false,
            "custom_data": null,
            "audience_min_age": null,
            "audience_max_age": null,
            "maximum_attendee_capacity": null,
            "minimum_attendee_capacity": null,
            "enrolment_start_time": null,
            "enrolment_end_time": null,
            "enrolment_url": null,
            "super_event_type": null,
            "sub_event_type": "sub_recurring",
            "deleted": false,
            "virtualevent_url": null,
            "replaced_by": null,
            "name": {
                "fi": "Kesäillan vesijumppa",
                "sv": "Kesäillan vesijumppa",
                "en": "Kesäillan vesijumppa"
            },
            "provider": {
                "fi": "Turun kaupungin liikuntapalvelut",
                "sv": "Turun kaupungin liikuntapalvelut",
                "en": "Turun kaupungin liikuntapalvelut"
            },
            "info_url": {
                "fi": "https://www.turku.fi/kulttuuri-ja-liikunta/liikunta/liikuntapaikat/uimapaikat-ja-vesiliikunta/maauimalat/vesijumpat",
                "sv": "https://www.turku.fi/kulttuuri-ja-liikunta/liikunta/liikuntapaikat/uimapaikat-ja-vesiliikunta/maauimalat/vesijumpat",
                "en": "https://www.turku.fi/kulttuuri-ja-liikunta/liikunta/liikuntapaikat/uimapaikat-ja-vesiliikunta/maauimalat/vesijumpat"
            },
            "provider_contact_info": null,
            "description": {
                "fi": "Reipas vesijumppa Kupittaan maauimalan isossa altaassa. Jumpataan altaan syvässä päässä ja käytetään kelluttavaa vesijuoksuvyötä. Halutessasi voit jumpata myös matalassa vedessä. Vaihtelevat ohjaajat ja ohjelma, välillä jumpataan välineillä välillä ilman. Välineet saat ohjaajalta, omaakin vesijuoksuvyötä voi halutessaan käyttää. Jokainen jumppaa oman kuntonsa mukaan. Aloittelijatkin rohkeasti mukaan jumppaamaan!Jokaiseen jumppaan ilmoittaudutaan etukäteen. Max. määrä 60 hlöä/jumppa.",
                "sv": "Reipas vesijumppa Kupittaan maauimalan isossa altaassa. Jumpataan altaan syvässä päässä ja käytetään kelluttavaa vesijuoksuvyötä. Halutessasi voit jumpata myös matalassa vedessä. Vaihtelevat ohjaajat ja ohjelma, välillä jumpataan välineillä välillä ilman. Välineet saat ohjaajalta, omaakin vesijuoksuvyötä voi halutessaan käyttää. Jokainen jumppaa oman kuntonsa mukaan. Aloittelijatkin rohkeasti mukaan jumppaamaan!Jokaiseen jumppaan ilmoittaudutaan etukäteen. Max. määrä 60 hlöä/jumppa.",
                "en": "Reipas vesijumppa Kupittaan maauimalan isossa altaassa. Jumpataan altaan syvässä päässä ja käytetään kelluttavaa vesijuoksuvyötä. Halutessasi voit jumpata myös matalassa vedessä. Vaihtelevat ohjaajat ja ohjelma, välillä jumpataan välineillä välillä ilman. Välineet saat ohjaajalta, omaakin vesijuoksuvyötä voi halutessaan käyttää. Jokainen jumppaa oman kuntonsa mukaan. Aloittelijatkin rohkeasti mukaan jumppaamaan!Jokaiseen jumppaan ilmoittaudutaan etukäteen. Max. määrä 60 hlöä/jumppa."
            },
            "location_extra_info": {
                "fi": "Blombergin aukio 12, Turku / Kupittaa, Kupittaan maauimala\n",
                "sv": "Blombergin aukio 12, Turku / Kupittaa, Kupittaan maauimala\n",
                "en": "Blombergin aukio 12, Turku / Kupittaa, Kupittaan maauimala\n"
            },
            "short_description": {
                "fi": "Vauhdikas vesijumppa illan päätteeksi!",
                "sv": "Vauhdikas vesijumppa illan päätteeksi!",
                "en": "Vauhdikas vesijumppa illan päätteeksi!"
            },
            "@id": "https://linkedevents-api.turku.fi/v1/event/turku:991417/",
            "@context": "https://schema.org",
            "@type": "Event/LinkedEvent"
        }
    ]
}
```


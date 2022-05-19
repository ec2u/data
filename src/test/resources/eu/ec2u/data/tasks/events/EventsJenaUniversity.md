---
title: Events › University › Jena
---

# Source

* https://www.uni-jena.de/veranstaltungskalender
  * general university events
* https://www.uni-jena.de/international/veranstaltungskalender
  * International Office
* https://www.uni-jena.de/kalenderstudiuminternational
  * International Office Calendar (specifically for incoming students)
* https://www.uni-jena.de/ec2u-veranstaltungen
  * EC2U-specific
* https://www.uni-jena.de/promotion-events
  * Graduate Academy

# Integration

* data extracted from schema.org-based event description embedded into each page as
  a `<script type="application/ld+json">` HTML head element
* no structured event index
  * event URLs are scraped crawling from the entry page and looking for links in `<div class="entry_wrapper">` body
    elements

# Upgrades

## 2022-05-19

* prevent generation of duplicate events when dates are modified (#6)
  * EC2U event IRIs are now generated on the basis of Jena event URLs
  * events published by multiple calendars are recognized and collapsed

# Samples

```xml

<div class="entry_wrapper chege">
    <div class="date">
        <time datetime="2022-05-19T16:15:00+02:00">19. Mai 2022</time>
    </div>
    <div class="time_categories">
        16:15 Uhr ·
        <span>Vortrag/Vorlesung</span>
    </div>
    <div class="title">
        Polymict crystalline impact breccias from the Nördlinger Ries impact structure, Germany - shock effects and
        mixing of target rocks
    </div>
    <div class="short">
        Prof. Dr. Claudia Trepmann (LMU München, Department für Geo– und Umweltwissenschaften)
    </div>
    <div class="additional_wrapper">
        <div class="additional">
            <a class="link"
               href="https://www.uni-jena.de/kommende-veranstaltungen/polymict-crystalline-impact-breccias-from-the-noerdlinger-ries-impact-structure-germany-shock-effects-and-mixing-of-target-rocks"
               hreflang="de"
               aria-label='Mehr erfahren über "Polymict crystalline impact breccias from the Nördlinger Ries impact structure, Germany - shock effects and mixing of target rocks"'>
                Mehr erfahren
            </a>
            <div class="icons">
            </div>
            <div class="placeholder"></div>
        </div>
    </div>
</div>
```

```xml

<script type="application/ld+json">
    {"@context":"https:\/\/schema.org","@type":"Event","name":"Polymict crystalline impact breccias from the Nördlinger
    Ries impact structure, Germany - shock effects and mixing of target rocks","description":"Prof. Dr. Claudia Trepmann
    (LMU München, Department für Geo– und
    Umweltwissenschaften)","url":"https:\/\/www.uni-jena.de\/kommende-veranstaltungen\/polymict-crystalline-impact-breccias-from-the-noerdlinger-ries-impact-structure-germany-shock-effects-and-mixing-of-target-rocks","inLanguage":"de-DE","startDate":"2022-05-19T16:15:00+0200","endDate":"2022-05-19T17:15:00+0200","location":[{"@type":"Place","address":{"@type":"PostalAddress","addressLocality":"jena","postalCode":"07749","streetAddress":"Burgweg
    11"}}],"organizer":[{"@type":"Organization","legalName":"Institut für
    Geowissenschaften"}],"speaker":[{"@type":"Person","givenName":"Claudia","familyName":"Trepmann"}],"isAccessibleForFree":false}
</script>
```

```json
{
    "@context": "https:\/\/schema.org",
    "@type": "Event",
    "name": "Polymict crystalline impact breccias from the Nördlinger Ries impact structure, Germany - shock effects and mixing of target rocks",
    "description": "Prof. Dr. Claudia Trepmann (LMU München, Department für Geo– und Umweltwissenschaften)",
    "url": "https:\/\/www.uni-jena.de\/kommende-veranstaltungen\/polymict-crystalline-impact-breccias-from-the-noerdlinger-ries-impact-structure-germany-shock-effects-and-mixing-of-target-rocks",
    "inLanguage": "de-DE",
    "startDate": "2022-05-19T16:15:00+0200",
    "endDate": "2022-05-19T17:15:00+0200",
    "location": [
        {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "jena",
                "postalCode": "07749",
                "streetAddress": "Burgweg 11"
            }
        }
    ],
    "organizer": [
        {
            "@type": "Organization",
            "legalName": "Institut für Geowissenschaften"
        }
    ],
    "speaker": [
        {
            "@type": "Person",
            "givenName": "Claudia",
            "familyName": "Trepmann"
        }
    ],
    "isAccessibleForFree": false
}
```


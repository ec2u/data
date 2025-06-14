# Site

* general university events
    * https://www.uni-jena.de/16965/kommende-veranstaltungen
    * https://www.uni-jena.de/en/16965/events
* International Office
    * https://www.uni-jena.de/17425/veranstaltungskalender
    * https://www.uni-jena.de/en/17425/upcoming-events
* International Office Calendar (specifically for incoming students)
    * https://www.uni-jena.de/81092/kalender-studium-international
    * https://www.uni-jena.de/en/81092/calendar-studium-international
* EC2U-specific
    * https://www.uni-jena.de/120659/ec2u-veranstaltungen
    * https://www.uni-jena.de/en/120659/ec2u-veranstaltungen
* Graduate Academy
    * https://www.uni-jena.de/17210/veranstaltungen
    * https://www.uni-jena.de/en/17210/events

Both German and English endpoints are scanned, generating independent events. Matching and merging localised
descriptions of the same events was deemed too complex and brittle.

# Integration

* Event info extracted by LLM from event catalog and linked event pages

## 2025-05-08

* migrated to LLM extraction

---

# Legacy API

* JSON-LD + schema.org
    * page-level metadata
    * no general structured index

# Integration

* no structured event index
    * event URLs are scraped crawling from the entry page
* data extracted from schema.org-based event description embedded into each page as
  a `<script type="application/ld+json">` HTML head element

## 2024-10-08

* fix XPath expressions for page link scraping
* add English event publishers

## 2023-01-10

* remove legacy patch for malformed date time zones

## 2022-06-12

* fix XPath expressions for page link scraping

## 2022-05-19

* prevent generation of duplicate events when dates are modified (#6)
    * EC2U event IRIs are now generated on the basis of Jena event URLs
    * events published by multiple calendars are recognized and collapsed

# Samples

```xml

<div class="entry_wrapper unijena">
    <div class="date">
        <time datetime="2022-06-13T16:00:00+02:00">13. Jun 2022</time>
    </div>
    <div class="time_categories_wrapper">
        <div class="time_categories">
            16:00 Uhr ·
            <span>Informationsveranstaltung</span>
        </div>
        <div class="edge_wrapper">
            <div class="edge"></div>
        </div>
    </div>
    <div class="title">
        <a href="https://www.uni-jena.de/kommende-veranstaltungen/praktikum-im-ausland-eu-praktikum-thueringen"
                hreflang="de">
            Praktikum im Ausland - internationale Berufserfahrung sammeln
        </a>
        <div class="edge_wrapper">
            <div class="edge"></div>
        </div>
    </div>
    <div class="short">
        Wie finde ich einen Praktikumsplatz und welche Unterstützung bekomme ich?
    </div>
    <div class="additional">
        <div class="icons">
            <img loading="lazy" decoding="async" title="Der Zugang zu dieser Veranstaltung ist barrierefrei."
                    alt="Der Zugang zu dieser Veranstaltung ist barrierefrei."
                    src="/skin/_global/_images/blocks/event_overview_accessible.png"
                    srcset="/skin/_global/_images/blocks/event_overview_accessible.svg">
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


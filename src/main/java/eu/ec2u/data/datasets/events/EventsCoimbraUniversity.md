# Site

* https://agenda.coimbra.pt/
  * Coimbra Agenda
  * Agenda Coimbra

# Integration

* Event catalog extracted by scanning the site event search service
* Event info extracted by LLM from event pages

## 2025-05-08

* migrated from https://agenda.uc.pt/ to https://agenda.coimbra.pt/

---

# Alternate Sources

## REST/JSON API

### Home page events

GET /v1/agenda/events/homepage
curl --location 'https://content.fw.uc.pt/v1/agenda/events/homepage'

### Search all events

GET /v1/agenda/events/search
curl
--location 'https://content.fw.uc.pt/v1/agenda/events/search?page=1&limit=20&category=conference&start_date=2025-01-01&end_date=2025-06-01'

### Event detail

GET /v1/agenda/events/{event_key}
curl --location 'https://content.fw.uc.pt/v1/agenda/events/ 017poxwx7b7650xz'

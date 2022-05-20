# Site

* https://www.univ-poitiers.fr/c/actualites/

# API

* https://www.univ-poitiers.fr/feed/events
  * WordPress RSS feed with custom fields

# Integration

* custom RSS adapter

# Content

* `schema:url`
* `schema:name`

* `schema:disambiguatingDescription`
* `schema:startDate`
  * time usually blank (defaulted to `00:00:00` at local time zone)
* `schema:endDate`
  * time usually blank (defaulted to `00:00:00` at local time zone)

# Pending

* nothing

# Upgrades

## 2022-05-20

* migrated to custom RSS adapter to take advantage of extended custom fields

# Samples

```http
GET https://www.univ-poitiers.fr/feed/events
```

```json
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
xmlns: content="http://purl.org/rss/1.0/modules/content/"
xmlns: wfw="http://wellformedweb.org/CommentAPI/"
xmlns:dc="http://purl.org/dc/elements/1.1/"
xmlns: atom="http://www.w3.org/2005/Atom"
xmlns: sy="http://purl.org/rss/1.0/modules/syndication/"
xmlns: slash="http://purl.org/rss/1.0/modules/slash/"
>
<channel>

<title>Université de Poitiers - Feed</title>
<atom: link href="https://www.univ-poitiers.fr/feed/events" rel="self" type="application/rss+xml"/>
<link>https: //www.univ-poitiers.fr</link>
<description></description>
<lastBuildDate>Thu, 19 May 2022 12: 32: 33 +0000</lastBuildDate>
<language></language>
<sy: updatePeriod>hourly</sy: updatePeriod>
<sy: updateFrequency>1</sy: updateFrequency>

<item>
<title>Sorties sportives</title>
<link>https: //www.univ-poitiers.fr/sorties-sportives/</link>
<date_from>01/05/2022</date_from>
<date_to>24/06/2022</date_to>
<hour_from></hour_from>
<hour_to></hour_to>

<pubDate>Fri, 29 Apr 2022 13: 25: 23 +0000</pubDate>
<dc:creator>jmurguet</dc: creator>
<guid isPermaLink="false">https: //www.univ-poitiers.fr/?p=102290</guid>
<description><![
CDATA[
En même temps que les beaux jours, les stages du suaps sont de retour !

Attention les places sont limitées !
]
]></description>
<content: encoded><![
CDATA[
En même temps que les beaux jours, les stages du suaps sont de retour !

Attention les places sont limitées !
]
]></content: encoded>
</item>
<item>
<title>Une École d’été pour accueillir et accompagner les étudiants ou futurs étudiants venant d’Ukraine (du
16 mai au 26 juin)
</title>
<link>
https: //www.univ-poitiers.fr/une-ecole-dete-pour-accueillir-et-accompagner-les-etudiants-ou-futurs-etudiants-venant-dukraine-du-16-mai-au-24-juin/
</link>
<date_from>16/05/2022</date_from>
<date_to>26/06/2022</date_to>
<hour_from></hour_from>
<hour_to></hour_to>

<pubDate>Wed, 27 Apr 2022 12: 21: 04 +0000</pubDate>
<dc: creator>spivette</dc: creator>
<guid isPermaLink="false">https://www.univ-poitiers.fr/?p=102199</guid>
<description>
<![ CDATA[ A partir du 16 mai et jusqu’au 26 juin, l’université de Poitiers organise une Ecole d’été gratuite « Welcome to Poitiers » pour accueillir et accompagner les étudiants ou futurs étudiants venant d’Ukraine: initiation au français, découverte de l’université, de la ville de Poitiers, ateliers de discussion et d’intégration dans la vie quotidienne française et activités sportives ou culturelles – de nombreux partenaires se mobilisent pour un été festif, solidaire et de partage. ] ]></description>
<content: encoded>
<![ CDATA[ A partir du 16 mai et jusqu’au 26 juin, l’université de Poitiers organise une Ecole d’été gratuite « Welcome to Poitiers » pour accueillir et accompagner les étudiants ou futurs étudiants venant d’Ukraine: initiation au français, découverte de l’université, de la ville de Poitiers, ateliers de discussion et d’intégration dans la vie quotidienne française et activités sportives ou culturelles – de nombreux partenaires se mobilisent pour un été festif, solidaire et de partage. ] ]></content: encoded>
</item>

</channel>
</rss>
```


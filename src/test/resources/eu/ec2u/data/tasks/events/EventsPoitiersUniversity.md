# Site

* https://www.univ-poitiers.fr/c/actualites/
  * University of Poitiers / News and Events
  * Université de Poitiers / Actualités et événements

# API

* https://www.univ-poitiers.fr/feed/events
  * WordPress RSS feed with custom fields

# Integration

* custom RSS adapter

## 2022-05-20

* migrated to custom RSS adapter to take advantage of extended custom fields

# Content

* `schema:url`
* `schema:name`
* `schema:disambiguatingDescription`
* `schema:startDate`
  * time usually blank (defaulted to `00:00:00` at local time zone)
* `schema:endDate`
  * time usually blank (defaulted to `00:00:00` at local time zone)
* `schema:location`
  * `schema:name`
  * `schema:description`
  * no structured location info

# Samples

```http
GET https://www.univ-poitiers.fr/feed/events
```

```xml
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
            <description><![ CDATA[ En même temps que les beaux jours, les stages du suaps sont de retour !

                Attention les places sont limitées ! ] ]>
            </description>
            <content: encoded><![ CDATA[ En même temps que les beaux jours, les stages du suaps sont de retour !

                Attention les places sont limitées ! ] ]>
            </content: encoded>
        </item>
        <item>
            <title>Journée d’études : Végétal Moyen Âge ! Plantes, santé et alimentation</title>
            <link>https://www.univ-poitiers.fr/journee-detudes-vegetal-moyen-age-plantes-sante-et-alimentation/</link>
            <date_from>20/05/2022</date_from>
            <date_to>20/05/2022</date_to>
            <hour_from></hour_from>
            <hour_to></hour_to>
            <place>
                <place_name>Jardin botanique universitaire de Poitiers,</place_name>
                <place_address>Domaine du Deffend, 1108, route des Sachères, 86550 Mignaloux-Beauvoir</place_address>
            </place>

            <pubDate>Tue, 10 May 2022 21:36:49 +0000</pubDate>
            <dc:creator>spivette</dc:creator>
            <guid isPermaLink="false">https://www.univ-poitiers.fr/?p=102520</guid>
            <description>
                <![CDATA[Le monde végétal est, au Moyen Âge, objet de représentations et d’usages variés, au sein desquels deux domaines se distinguent : l’alimentation et les remèdes. L’économie, la production alimentaire et les représentations symboliques des sociétés médiévales occidentales reposent fondamentalement sur la céréaliculture et la vigne, tandis que les connaissances en manière de médecine curative s’appuient largement sur les propriétés des végétaux. Cette journée d’études organisée par le CESCM propose d’apporter un regard interdisciplinaire sur ces deux domaines, en associant historiens, littéraires et archéologues à une discussion générale sur les usages et les représentations des plantes dans l’alimentation et les pratiques de santé médiévales.]]></description>
            <content:encoded>
                <![CDATA[Le monde végétal est, au Moyen Âge, objet de représentations et d’usages variés, au sein desquels deux domaines se distinguent : l’alimentation et les remèdes. L’économie, la production alimentaire et les représentations symboliques des sociétés médiévales occidentales reposent fondamentalement sur la céréaliculture et la vigne, tandis que les connaissances en manière de médecine curative s’appuient largement sur les propriétés des végétaux. Cette journée d’études organisée par le CESCM propose d’apporter un regard interdisciplinaire sur ces deux domaines, en associant historiens, littéraires et archéologues à une discussion générale sur les usages et les représentations des plantes dans l’alimentation et les pratiques de santé médiévales.]]></content:encoded>
        </item>

    </channel>
</rss>
```


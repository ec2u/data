# Site

* https://www.tyy.fi/en/activities/calendar-events
  * Turun yliopiston ylioppilaskunta (TYY) / Tapahtumakalenteri
  * The Student Union of the University of Turku (TYY) / Calendar of Events

# Integration

* Custom JSON API adapter

## Pending

* retrieve and merge FInnish content

## 2022-07-28

* initial integration

# Content

* `schema:url`
* `schema:name`
* `schema:image`
* `schema:description`
* `schema:startDate`
* `schema:endDate`
* `schema:organizer`
* `schema:location`
  * `schema:name`
  * `schema:address`
    * `schema:name` (unstructured address)

# API

## JSON

```http
GET https://www.tyy.fi/events.json/fi
Accept: application/json
```

```http
GET https://www.tyy.fi/events.json/en
Accept: application/json
```

```json
{
    "events": [
        {
            "event": {
                "nid": "20151",
                "start_date": "2022-09-06T12:00:00+03:00",
                "end_date": "2022-09-06T16:00:00+03:00",
                "title": "sTYYlish Opening Carnival",
                "url": "https://www.tyy.fi/fi/node/20151",
                "organiser": "TYY",
                "location": null,
                "image": null,
                "content": "<p> </p>\n\n<p>What happens on the University Hill, doesn't stay on the University Hill!</p>\n\n<p> </p>\n\n<p>The new academic year starts with a traditional Opening Carnival organised by the University of Turku and the Student Union (TYY) together. In celebration of the 100th anniversary year of TYY, the carnival is organised in The Old Great Square (fin. Vanha Suurtori), where all townspeople will also get to know what TYY and the University are all about.</p>\n\n<p>In the carnival, new students get to meet different organisations and enjoy a fun programme, which includes welcome speeches from the Rector and the chair of TYY's Executive Board, awarding the teacher and course of the year, musical performances and other sTYYlish festivities.</p>\n\n<p> </p>\n\n<p>In case of rain, the event will be moved indoors in the Educarium building. The possible change of plans will be posted in TYY's and the University's social media pages at latest on the morning of the event day.</p>\n",
                "category_tid": "29",
                "source_nid": "20151",
                "is_tyy": "0",
                "address": "Vanha Suurtori",
                "Sijainti": null
            }
        },
        {
            "event": {
                "nid": "20154",
                "start_date": "2022-09-07T21:00:00+03:00",
                "end_date": "2022-09-07T23:59:00+03:00",
                "title": "sTYYlish Opening Party",
                "url": "https://www.tyy.fi/fi/node/20154",
                "organiser": "TYY",
                "location": "Marilyn, Vegas and Forte",
                "image": null,
                "content": "<p>When the long, hot summer slowly ends, it is time to return to campus. What would be a better way to start a new semester than a big Interdisciplinary party.<br /><br />\nTYY is throwing the biggest party of the autumn with three bars: Marilyn, Vegas and Forte. You can come alone or together but make sure that you don't miss this party!</p>\n\n<p>You can get tickets in advance in the Study in Turku -fair on 30.8. and in the sTYYlish Opening Carneval on 6.9. at The Old Great Square (fin. Vanha Suurtori) at 12-16 o'clock.<br /><br />\nTickets cost 3 euros and you can pay with cash or card. Be quick, there are only a limited number of tickets for sale in advance!</p>\n",
                "category_tid": "7",
                "source_nid": "20153",
                "is_tyy": "0",
                "address": "Eerikinkatu 19",
                "Sijainti": null
            }
        },
        {
            "event": {
                "nid": "20164",
                "start_date": "2022-11-03T19:00:00+02:00",
                "end_date": "2022-11-11T23:59:00+02:00",
                "title": "TYY's Anniversary Week celebrations",
                "url": "https://www.tyy.fi/fi/node/20164",
                "organiser": null,
                "location": null,
                "image": null,
                "content": "<p>Join us in celebration of one hundred years of TYY and our events!</p>\n\n<p>The countdown to the Annual Ball starts on 3.11.2022 with a Countdown party in Marilyn and Vegas!</p>\n\n<p>During the week, you can join us in learning the Annual Ball songs and dance moves, as well as celebrate Porthan day with us. The organisations can also add their own events as part of the Anniversary Week festivities. Sing ups and more information: tyy-tapahtumatuottaja@utu.fi</p>\n\n<p> </p>\n\n<p>Happy birthday TYY 100 years!</p>\n",
                "category_tid": "29",
                "source_nid": "20163",
                "is_tyy": "0",
                "address": "Rehtorinpellonkatu 4 A",
                "Sijainti": null
            }
        }
    ]
}
```

## RSS

```http
GET https://www.tyy.fi/rss/kalenteri.xml
```

```xml
<?xml version="1.0" encoding="utf-8" ?>
<rss version="2.0" xml:base="https://www.tyy.fi/fi/rss/kalenteri.xml" xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Event</title>
        <link>https://www.tyy.fi/fi/rss/kalenteri.xml</link>
        <description></description>
        <language>fi</language>
        <atom:link href="https://www.tyy.fi/fi/rss/kalenteri.xml" rel="self" type="application/rss+xml"/>
        <item>
            <title>sTYYlish Opening Carnival</title>
            <link>https://www.tyy.fi/fi/node/20151</link>
            <description>&lt;p&gt; &lt;/p&gt;

                &lt;p&gt;What happens on the University Hill, doesn&#039;t stay on the University Hill!&lt;/p&gt;

                &lt;p&gt; &lt;/p&gt;

                &lt;p&gt;The new academic year starts with a traditional Opening Carnival organised by the University of
                Turku and the Student Union (TYY) together. In celebration of the 100th anniversary year of TYY, the
                carnival is organised in The Old Great Square (fin. Vanha Suurtori), where all townspeople will also get
                to know what TYY and the University are all about.&lt;/p&gt;

                &lt;p&gt;In the carnival, new students get to meet different organisations and enjoy a fun programme,
                which includes welcome speeches from the Rector and the chair of TYY&#039;s Executive Board, awarding the
                teacher and course of the year, musical performances and other sTYYlish festivities.&lt;/p&gt;

                &lt;p&gt; &lt;/p&gt;

                &lt;p&gt;In case of rain, the event will be moved indoors in the Educarium building. The possible change
                of plans will be posted in TYY&#039;s and the University&#039;s social media pages at latest on the
                morning of the event day.&lt;/p&gt;
            </description>
            <pubDate>Tue, 06 Sep 2022 12:00:00 +0300</pubDate>
            <dc:creator>tyy.fi</dc:creator>
            <guid isPermaLink="false">20151</guid>
        </item>
        <item>
            <title>TYYlikäs Avajaiskarnevaali</title>
            <link>https://www.tyy.fi/fi/toiminta/tapahtumakalenteri/tyylikas-avajaiskarnevaali</link>
            <description>&lt;p&gt; &lt;/p&gt;

                &lt;p&gt;Mitä tapahtuu yliopistonmäellä, ei jää yliopistonmäelle!&lt;/p&gt;

                &lt;p&gt; &lt;/p&gt;

                &lt;p&gt;Turun yliopiston ja Turun yliopiston ylioppilaskunnan perinteiset Avajaiskarnevaalit
                järjestetään TYYn juhlavuoden kunniaksi Vanhalla Suurtorilla, missä myös turkulaiset pääsevät näkemään,
                keitä me TYYläiset ja yliopistolaiset oikein olemme.&lt;/p&gt;

                &lt;p&gt; &lt;/p&gt;

                &lt;p&gt;TYYlikäs Avajaiskarnevaali aloittaa yhteisen akateemisen vuoden ja tapahtumassa uudet
                opiskelijat pääsevät tutustumaan erilaisiin järjestöihin ja yliopiston toimijoihin sekä nauttimaan
                monipuolisesta ohjelmasta.&lt;/p&gt;

                &lt;p&gt;Luvassa on muun muassa rehtorin ja TYYn puheenjohtajan tervehdys, vuoden opettajan ja
                opintojakson palkitseminen sekä musiikkia ja muuta TYYlikästä karkelointia.&lt;/p&gt;

                &lt;p&gt; &lt;/p&gt;

                &lt;p&gt;Sateen sattuessa tilaisuus siirretään Educariumin aulaan. Tästä ilmoitetaan TYYn ja yliopiston
                somessa viimeistään tapahtumapäivän aamuna.&lt;/p&gt;
            </description>
            <pubDate>Tue, 06 Sep 2022 12:00:00 +0300</pubDate>
            <dc:creator>tyy.fi</dc:creator>
            <guid isPermaLink="false">20152</guid>
        </item>
        <item>
            <title>TYYlikäs Avaus</title>
            <link>https://www.tyy.fi/fi/toiminta/tapahtumakalenteri/tyylikas-avaus-3</link>
            <description>&lt;p&gt;Pitkän, kuuman kesän kääntyessä syksyyn on aika palata opintojen pariin kampukselle.
                Mikä olisikaan parempi tapa juhlistaa uuden lukuvuoden alkua kuin tulla tapaamaan sekä uusia että vanhoja
                opiskelijakavereita TYYlikkääseen avaukseen.&lt;br /&gt;&lt;br /&gt;
                TYYn avajaisviikolla järjestetään syksyn suurimmat ja poikkitieteellisimmät baaribileet, kun sekä
                Marilyn, Vegas että Forte avaavat bilekeitaansa ovet TYYlikkään Avauksen juhlijoille. Tulet sitten yksin
                tai yhdessä, näitä juhlia et halua jättää väliin!&lt;br /&gt;&lt;br /&gt;
                Ennakkolippuja on rajoitettu määrä, joten kannattaa olla nopea!&lt;br /&gt;
                Lippuja myydään mm. Study in Turku -messuilla ICT-Cityllä 30.8. ja Avajaiskarnevaaleilla Vanhalla
                Suurtorilla 6.9. klo 12-16.&lt;br /&gt;&lt;br /&gt;
                Lipun hinta 3 €, maksu joko käteisellä tai kortilla. Ostamalla lipun ennakkoon ja saapumalla juhliin
                ennen klo 23, saat varmasti TYYlikkään haalarimerkin itsellesi!&lt;/p&gt;
            </description>
            <pubDate>Wed, 07 Sep 2022 21:00:00 +0300</pubDate>
            <dc:creator>tyy.fi</dc:creator>
            <guid isPermaLink="false">20153</guid>
        </item>
    </channel>
</rss>
```

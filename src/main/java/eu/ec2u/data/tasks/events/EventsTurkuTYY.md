# Site

* https://www.tyy.fi/en/activities/calendar-events
  * Turun yliopiston ylioppilaskunta (TYY) / Tapahtumakalenteri
  * The Student Union of the University of Turku (TYY) / Calendar of Events

# Integration

* Custom JSON API adapter

## Pending

* retrieve and merge Finnish content

## 2022-09-22

* update to use modified APIs
  * `image/organizer/location` no longer included

## 2022-07-28

* initial integration

# Content

* `schema:url`
* `schema:name`
* `schema:description`
* `schema:startDate`
* `schema:endDate`

# API

## JSON

```http
GET https://www.tyy.fi/fi/events.json
Accept: application/json
```

```http
GET https://www.tyy.fi/en/events.json
Accept: application/json
```

```json
[
    {
        "title": "TYRMY Get-To-Know Party",
        "content": "  \n    \n              \n          \n    \n          <p>We are once again welcoming all TYRMY people old and new, and those interested in TYRMY, to our Get-To-Know party at TYY sauna in 10.9. from 18 to 23 o'clock.<\/p>\n\n<p>You can look forward to music, good company and sauna. TYRMY is offering refreshments in form of snacks and a punch, but we recommend bringing your own drinks too. If you want to go to sauna, bring your own towel.<\/p>\n\n<p>You can also buy TYRMY merchandise at the sauna, so remember to bring some cash with you.<\/p>\n\n<p>At 23 o'clock we will leave for the afterparty.<\/p>\n\n<p>WHAT: Get-To-Know party<br \/>\nWHEN: 10.9. 18-23 o'clock<br \/>\nWHERE: TYY sauna, YO-talo A, Rehtorinpellonkatu 4<\/p>\n\n<p>Facebook event<\/p>\n      \n\n\n        \n          \n  \n",
        "nid": "10524",
        "is_tyy": "0",
        "url": "http:\/\/www.tyy.fi\/en\/node\/10524",
        "start_date": "2022-09-10T15:00:00"
    },
    {
        "title": "Terrakoti open doors",
        "content": "  \n    \n              \n          \n    \n          <p dir=\"ltr\">Are you interested in science fiction, fantasy, anime, gaming, or just everything weird in general? Want to spend time in a nice, like-minded company?<\/p>\n\n<p dir=\"ltr\">Terrakoti is the living room of six geek societies located in Turku at Student House B.<\/p>\n\n<p dir=\"ltr\">Student nations can be found next to Terrakoti. Although the original unifying theme of the nations is the regions of Finland, international students are welcome to these traditional associations as well. Anyone interested in trying out different varieties of tea or wine, casual outdoor or board games, or just hanging out in a relaxed atmosphere will have a good time with the nations.<\/p>\n\n<p dir=\"ltr\">We are having an all-week-long open doors event from 12th to 18th of September.<\/p>\n\n<p> <\/p>\n\n<p>Schedule<\/p>\n\n<p dir=\"ltr\">Monday, Sept 13th: All clubs. From 4 pm to 7 pm at Osakuntasali, Terrakoti and the Osakunta wuarters in Studenthouse B.<\/p>\n\n<p dir=\"ltr\">Wednesday, Sept 14th: ANC (console playing). From 1 to 5 pm, at Terrakoti. Followed by the casual bi-weekly gaming hangout.<\/p>\n\n<p dir=\"ltr\">Thursday, Sept 15th: Tutka &amp; TSFS (science fiction and fantasy). From noon to 5 pm, at Terrakoti. Followed by the weekly Varjomafia gathering at the same place.<\/p>\n\n<p dir=\"ltr\">Friday, Sept 16th: Senpai (anime &amp; manga). From 5 pm at Terrakoti. Movie night: Fumetsu no Anata e \/ To your eternity.<\/p>\n\n<p dir=\"ltr\">Sunday, Sept 18th: Tyrmä (roleplaying and board games). From 2 to 8 pm at Kampuskappeli. Board game night, possibly also information about upcoming new roleplay campaigns.<\/p>\n\n<p dir=\"ltr\">The societies organise actively live and\/or online events during the autumn. Find out more on the websites and on social media. You can naturally come to meet us at the Study in Turku fair on Aug 30th and Turku university Opening carnival on Tuesday, Sept 6th, as well.<\/p>\n\n<p dir=\"ltr\">Event on Facebook<\/p>\n\n<p>Accessibility<\/p>\n\n<p>The premises are on the ground floor of Student house B so there are no steps or stairs. However, there are no accessible toilets, the nearest are at Kampuskappeli in Yo-talo C and the student restaurant Assarin ullakko around the corner.<\/p>\n      \n\n\n        \n          \n  \n",
        "nid": "10526",
        "is_tyy": "0",
        "url": "http:\/\/www.tyy.fi\/en\/node\/10526",
        "start_date": "2022-09-12T11:00:00"
    },
    {
        "title": "Terrakodin ja osakuntien avoimien ovien viikko",
        "content": "  \n    \n              \n            \n    \n          \n  \n      \n      Image\n    \n            \n\n\n\n      \n\n\n  \n\n      \n\n\n        \n        \n          \n    \n          <p dir=\"ltr\">Oletko kiinnostunut scifistä, fantasiasta tai kauhusta? Animesta tai mangasta? Rooli- tai konsolipelaamisesta? Haluaisitko ylipäätään viettää aikaasi mukavassa, poikkitieteellisessä mutta samanhenkisessä seurassa?<\/p>\n\n<p dir=\"ltr\">Yo-talo B:ssä toimivat osakunnat ja Terrakodin yhdistykset järjestävät 12.9.–18.9. toimintansa esittelemiseksi avoimien ovien päivät uusille ja vanhemmille opiskelijoille ja muille kiinnostuneille. Tervetuloa tutustumaan!<\/p>\n\n<p dir=\"ltr\">Terrakoti on toimisto ja kokoontumistila, jolla majailee viisi nörttikulttuuriin eri tavoin keskittynyttä harrastusjärjestöä sekä kattojärjestö Terrakoti.<\/p>\n\n<p dir=\"ltr\">Osakunnat ovat ylioppilaskunnan vanhimpia järjestöjä, jotka hallinnoivat mm. Osakuntasalia ja siellä esitteillä olevaa näyttävää vaakunakokoelmaa. Osakuntien jäsenistöt viettävät päivittäin vapaa-aikaansa salin läheisyydessä toimistoillaan ja toivottavat kaikki tervetulleiksi tutustumaan perinteikkäisiin yhdistyksiin avointen ovien viikolla.<\/p>\n\n<p>Viikon ohjelma<\/p>\n\n<p dir=\"ltr\">Ma 12.9.: Klo 14–19, paikkana Osakuntasali ja Yo-talo B:n järjestötilat. Yhdistysten yhteinen päivä. Terrakoti ja osakuntien tilat avoinna, kaikkien yhdistysten toiminnan esittelyä.<\/p>\n\n<p dir=\"ltr\">Ke 14.9.: ANC (videopelit). Klo 13-17, paikkana Terrakoti.  Klo 17 alkaen rento hengailuilta videopelien parissa.<\/p>\n\n<p dir=\"ltr\">To 15.9.: Tutka &amp; TSFS (scifi ja fantasia). Klo 12–17, paikkana Terrakoti. Klo 17 jälkeen viikoittainen Varjomafia-hengailuilta samassa paikassa.<\/p>\n\n<p dir=\"ltr\">Pe 16.9.: Senpai (anime ja manga) Klo 17, paikkana Terrakoti. Videoilta Fumetsu no Anata e \/ To your eternity.<\/p>\n\n<p dir=\"ltr\">Su 18.9.: Tyrmä (rooli- ja lautapelit). Klo 14-20, paikkana Kampuskappeli. Lautapeli-ilta ja mahdollisesti uusien roolipelikampanjoiden mainostamista.<\/p>\n\n<p dir=\"ltr\">Voit tulla vierailemaan tapahtumassa minä päivänä tahansa. Mikäli sinua kiinnostaa erityisesti jonkin seuran toiminta, kannattaa käynti ajoittaa päivään, jolloin sillä on päivystysvastuu, ja vastaavasti jos on kiinnostunut useammasta yhdistyksestä, on maanantai kätevin päivä.<\/p>\n\n<p dir=\"ltr\">Terrakoti, osakunnat ja Osakuntasali sijaitsevat Yo-talo B:ssä, osoitteessa Rehtorinpellonkatu 4, Proffan kellarin naapurissa ja Assarin ullakon takana. Sisäänkäynti on vihreäseinäisessä talossa kyltin Osakuntasali ja B-talon 1. kerros alapuolella. Kampuskappeli on Yo-talo C:ssä, sen sisäänkäynti on Rehtorinpellonkadulta Yo-talojen pyöräparkin ja päiväkodin välistä.<\/p>\n\n<p dir=\"ltr\">Yhdistykset järjestävät pitkin syksyä aktiivisesti toimintaa, johon pääsee mukaan muutenkin, vaikka tämän viikon missaisikin. Niillä on myös aktiiviset Discord-palvelimet. Uudet kävijät ovat lämpimästi tervetulleita toimintaan!<\/p>\n\n<p dir=\"ltr\">Lisätietoa yhdistysten nettisivuilla ja somekanavilla. Useimmat yhdistyksistä ovat mukana myös Study in Turku -messuilla tiistaina 30.8. klo 10–16 ja Turun yliopiston Avajaiskarnevaaleilla tiistaina 6.9. klo 12–16.<\/p>\n\n<p dir=\"ltr\">Pandemia-ajasta oppineena, tulethan paikalle vain terveenä. <\/p>\n\n<p dir=\"ltr\">Tapahtuma Facebookissa<\/p>\n\n<p>Esteettömyydestä<\/p>\n\n<p dir=\"ltr\">Osakuntatilat ja Terrakoti sijaitsevat katutasossa eikä tiloissa ole portaita. Invavessaa tiloissa ei kuitenkaan ole (lähin Kampuskappelilla ja Assarin ullakko -opiskelijaravintolassa kulman takana).<\/p>\n\n<p>Yhdistysten sivut<\/p>\n\n<p dir=\"ltr\">Terrakoti:<\/p>\n\n<p dir=\"ltr\">Academic Nintendo Club (ANC)<\/p>\n\n<p dir=\"ltr\">Turun anime- ja mangaseura Senpai<\/p>\n\n<p dir=\"ltr\">Turun Science Fiction Seura (TSFS)<\/p>\n\n<p dir=\"ltr\">Turun yliopiston tieteiskulttuurikabinetti (Tutka)<\/p>\n\n<p dir=\"ltr\">Turun yliopiston rooli- ja strategiapeliseura Tyrmä<\/p>\n\n<p dir=\"ltr\">Lisätietoa koko Terrakodista<\/p>\n\n<p dir=\"ltr\">Osakunnat:<\/p>\n\n<p dir=\"ltr\">Satakuntalais-Hämäläinen osakunta (SHO)<\/p>\n\n<p dir=\"ltr\">Savo-Karjalainen osakunta (SKO)<\/p>\n\n<p dir=\"ltr\">SHO:n ja SKO:n yhteistyöjärjestö S-Osakunnat ry<\/p>\n\n<p dir=\"ltr\">Läheinen yhteistyökumppani Turun Pohjalainen osakunta (TPO)<\/p>\n\n<p dir=\"ltr\"> <\/p>\n\n<p dir=\"ltr\">Tervetuloa!<\/p>\n      \n\n\n        \n          \n  \n",
        "nid": "10525",
        "is_tyy": "0",
        "url": "http:\/\/www.tyy.fi\/fi\/node\/10525",
        "start_date": "2022-09-12T11:00:10"
    }
]
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

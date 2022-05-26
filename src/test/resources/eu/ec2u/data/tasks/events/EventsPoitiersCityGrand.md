# Site

* https://sortir.grandpoitiers.fr/
  * Sortir Grand Poitiers
  * Events at Grand Poitier

# API

* RSS feed / https://typo3.org/
  - https://sortir.grandpoitiers.fr/agenda/rss
    - some deviations wrt to WordPress
    - see also Events › Jena › City

# Integration

* custom RSS adapter

## Pending

* filter RSS feed to include only Poitier events?

* ask for assistance from technical contact

## 2022-05-26

* initial integration

# Content

* `schema:url`
* `schema:name`
* `schema:image`
* `schema:description`
* `schema:startDate`
* `schema:endDate`
* `dct:subject`

# Samples

```http
GET https://sortir.grandpoitiers.fr/agenda/rss
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:ev="http://purl.org/rss/1.0/modules/event/">
    <channel>
        <title>sortir.grandpoitiers.fr : Toutes les dates</title>
        <link>https://sortir.grandpoitiers.fr/agenda/rss</link>
        <description>Toutes les dates dès leur publication sur le site sortir.grandpoitiers.fr</description>
        <language>fr</language>
        <copyright>sortir.grandpoitiers.fr</copyright>
        <atom:link href="https://sortir.grandpoitiers.fr/agenda/rss" rel="self" type="application/rss+xml"/>
        <lastBuildDate>Tue, 24 May 2022 15:17:32 +0200</lastBuildDate>
        <generator>TYPO3 EXT:news</generator>
     
        <item>
            <guid isPermaLink="false">news-25943</guid>
            <pubDate>Fri, 11 Feb 2022 00:00:00 +0100</pubDate>
            <title>Spectacle de danse de Flex Pointe à la Hune</title>
            <link>http://sortir.grandpoitiers.fr/agenda/spectacle-de-danse-de-flex-pointe-a-la-hune-25943</link>
            <ev:startdate>2022-02-11T20:00:00Z</ev:startdate>
            <ev:enddate>2022-06-11T22:30:00Z</ev:enddate>
            <category>Danse</category>
            <description>
                <![CDATA[<p>            Date :                                                         Du                                                11-02                                        à        11-06-2022                                                 Date de début 20:00 Date de fin 22:30                <br />Lieu :                     La Hune<br/>1 Avenue Du Champ De La Caille<br/>86280 Saint-Benoît                     </p><p>Catégorie : Danse</p><p></p><p>Samedi 11 juin à 20h : Spectacle de danse de Flex Pointe à la Hune</p><p>De la danse classique à la danse jazz, en passant par la danse contemporaine et la danse actuelle, le spectacle offre émotion, créativité et originalité. Spectacle chorégraphié par les professeurs de l’association où les danseurs expriment leur passion, leur sensibilité. Une rencontre à ne pas manquer !</p><p>Renseignements et billetterie :</p><ul><li>Flex Pointe : 06 89 56 24 92 - <a href="javascript:linkTo_UnCryptMailto(%27nbjmup%2Bgmfyqpjouf97Ahnbjm%5C%2Fdpn%27);">flexpointe86@gmail.com</a> ou <a href="http://flexpointe.com" target="_blank">flexpointe.com</a></li><li>Tarif Adulte : 10€</li><li>Tarif Enfant moins de 8 ans : 5€</li></ul>]]></description>
            <content:encoded>
                <![CDATA[<p>            Date :                                                         Du                                                11-02                                        à        11-06-2022                                                 Date de début 20:00 Date de fin 22:30                <br />Lieu :                     La Hune<br/>1 Avenue Du Champ De La Caille<br/>86280 Saint-Benoît                     </p><p>Catégorie : Danse</p><p></p><p>Samedi 11 juin à 20h : Spectacle de danse de Flex Pointe à la Hune</p><p>De la danse classique à la danse jazz, en passant par la danse contemporaine et la danse actuelle, le spectacle offre émotion, créativité et originalité. Spectacle chorégraphié par les professeurs de l’association où les danseurs expriment leur passion, leur sensibilité. Une rencontre à ne pas manquer !</p><p>Renseignements et billetterie :</p><ul><li>Flex Pointe : 06 89 56 24 92 - <a href="javascript:linkTo_UnCryptMailto(%27nbjmup%2Bgmfyqpjouf97Ahnbjm%5C%2Fdpn%27);">flexpointe86@gmail.com</a> ou <a href="http://flexpointe.com" target="_blank">flexpointe.com</a></li><li>Tarif Adulte : 10€</li><li>Tarif Enfant moins de 8 ans : 5€</li></ul>]]></content:encoded>
            <enclosure url="https://sortir.grandpoitiers.fr/fileadmin/user_upload/cs264y1vw2y5yerdlem2eeibwvq6w6d5.jpg"
                       length="279646" type="image/jpeg"/>
        </item>
        <item>
            <guid isPermaLink="false">news-23496</guid>
            <pubDate>Sun, 27 Feb 2022 00:00:00 +0100</pubDate>
            <title>Le sol</title>
            <link>http://sortir.grandpoitiers.fr/agenda/le-sol-23496</link>
            <ev:startdate>2022-02-27T00:00:00Z</ev:startdate>
            <ev:enddate>2022-05-30T00:00:00Z</ev:enddate>
            <category>Exposition documentaire</category>
            <description>
                <![CDATA[<p>            Date :                                                         Du                                                27-02                                        à        29-05-2022                                                                 <br />Lieu :                     Espace Mendès France<br/>1 rue de la cathédrale<br/>86000 Poitiers                     </p><p>Catégorie : Exposition documentaire</p><p></p><p>Le sol est un patrimoine pour toute la planète.</p><ul><li>Entrée libre</li></ul>]]></description>
            <content:encoded>
                <![CDATA[<p>            Date :                                                         Du                                                27-02                                        à        29-05-2022                                                                 <br />Lieu :                     Espace Mendès France<br/>1 rue de la cathédrale<br/>86000 Poitiers                     </p><p>Catégorie : Exposition documentaire</p><p></p><p>Le sol est un patrimoine pour toute la planète.</p><ul><li>Entrée libre</li></ul>]]></content:encoded>
            <enclosure
                    url="https://sortir.grandpoitiers.fr/fileadmin/Agenda/2022/02_Fevrier_2022/Exposition_-_Le_sol_-_cre__dit_Pixabay.jpg"
                    length="178853" type="image/jpeg"/>
        </item>
        <item>
            <guid isPermaLink="false">news-23779</guid>
            <pubDate>Fri, 04 Mar 2022 16:55:07 +0100</pubDate>
            <title>Les belles heures du Palais</title>
            <link>http://sortir.grandpoitiers.fr/agenda/les-belles-heures-du-palais-23779</link>
            <ev:startdate>2022-03-04T00:00:00Z</ev:startdate>
            <ev:enddate>2023-01-01T00:00:00Z</ev:enddate>
            <category>Visite/Patrimoine</category>
            <description>
                <![CDATA[<p>            Date :                                                         Du                                                04-03                                        à        31-12-2022                                                                 <br />Lieu :                     Le Palais<br/>10 Place Alphonse Lepetit<br/> Poitiers                     </p><p>Catégorie : Visite/Patrimoine</p><p></p><p>Édifice emblématique de Poitiers, le Palais constitue l’un des plus remarquables ensembles d’architecture civile médiévale en France. L’expo propose d’aller à la rencontre des grands personnages qui lui sont associés.</p><ul><li><p>Tous les jours, de 11h à 18h<strong>&nbsp;durant les vacances scolaires</strong></p></li><li><p>Hors vacances,&nbsp;<strong>le mercredi de 13h à 18h,</strong>&nbsp;<strong>le week-end de 11h à 18h.</strong></p></li></ul>]]></description>
            <content:encoded>
                <![CDATA[<p>            Date :                                                         Du                                                04-03                                        à        31-12-2022                                                                 <br />Lieu :                     Le Palais<br/>10 Place Alphonse Lepetit<br/> Poitiers                     </p><p>Catégorie : Visite/Patrimoine</p><p></p><p>Édifice emblématique de Poitiers, le Palais constitue l’un des plus remarquables ensembles d’architecture civile médiévale en France. L’expo propose d’aller à la rencontre des grands personnages qui lui sont associés.</p><ul><li><p>Tous les jours, de 11h à 18h<strong>&nbsp;durant les vacances scolaires</strong></p></li><li><p>Hors vacances,&nbsp;<strong>le mercredi de 13h à 18h,</strong>&nbsp;<strong>le week-end de 11h à 18h.</strong></p></li></ul>]]></content:encoded>
            <enclosure
                    url="https://sortir.grandpoitiers.fr/fileadmin/Agenda/2022/03_Mars_2021/Les_belles_heures_du_Palais__c__Yann_Gachet__5_.jpg"
                    length="43804" type="image/jpeg"/>
        </item>
   
    </channel>
</rss>
```

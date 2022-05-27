# Site

* https://www.poitiers.fr/
  * https://www.poitiers.fr/c__0_0_manifestation_0__0__voir_tous_les_evenements.html
  * Ville de Poitiers / Evenements
  * City of Poitiers / Events

# API

* RSS
  * https://www.poitiers.fr/rss/rss_agenda_mobile_.xml
  * other RSS feeds linked from the home page

- ~~RSS~~
  - mentioned by site header at https://www.poitiers.fr/c__2_266__Flux_RSS.html
  - the relevant link at https://www.poitiers.fr/rss/rss_agenda.xml is 404

# Integration

* custom RSS adapter

## Pending

* initial survey mentioned som site overhaul planned
  * ask for timeline
  * review after overhaul is completed

## 2022-05-26

* initial integration

# Content

* ~~`schema:url`~~
  * included in RSS feed but with broken URLs
* `schema:name`
* ~~`schema:image`~~
  * included in RSS feed but with broken URLs
* `schema:description`
* `schema:startDate`
* `schema:endDate`
* `dct:subject`

# Samples

```http
GET https://www.poitiers.fr/rss/rss_agenda_mobile_.xml
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:c="http://base.google.com/cns/1.0">
    <channel>
        
        <title>Ville de Poitiers</title>
        <link>http://www.poitiers.fr</link>
        <description>Agenda</description>
        <managingEditor>communication@mairie-poitiers.fr</managingEditor>
        <webMaster>webmaster@mairie-poitiers.fr</webMaster>
        <copyright>Copyright - Ville de Poitiers</copyright>
        <image>
            <url>
                http://www.poitiers.fr/images/mairie_poitiers_rss.gif
            </url>
            <title>Ville de Poitiers - Agenda</title>
            <link>http://www.poitiers.fr</link>
        </image>
        <pubDate>Sat, 31 Oct 2015 18:18:49 GMT</pubDate>
        
        <item>
            <author>webmaster@mairie-poitiers.fr</author>
            <title>
                <![CDATA[Images rÃ©vÃ©lÃ©es : Poitiers Ã  lâÃ©preuve de la photographie (1839-1914)  (Exposition documentaire)]]></title>
            <link>
                http://www.poitiers.fr/rss__0_0_Manifestation_21322__0__Images_revelees_Poitiers_a_l_epreuve_de_la_photographie_1839_1914_.html
            </link>
            <description>
                <![CDATA[<p><strong>Du 16 Octobre au 17 Janvier</strong>&nbsp;&nbsp;</p><h6>Art et pratiques photographiques (mus&eacute;e Sainte-Croix) - Diffusion et usages de la photographie (M&eacute;diath&egrave;que Fran&ccedil;ois-Mitterrand)</h6><p>L&rsquo;exposition pr&eacute;sente un panorama exceptionnel de la cr&eacute;ation photographique &agrave; Poitiers, depuis les d&eacute;buts du daguerr&eacute;otype dans les ann&eacute;es 1840, jusqu&rsquo;aux expositions artistiques du d&eacute;but du XXe si&egrave;cle qui virent l&rsquo;explosion des pratiques amateurs. La sc&eacute;nographie privil&eacute;gie &eacute;preuves et tirages d&rsquo;&eacute;poque, pour la plupart in&eacute;dits.</p><p>17 octobre, 7 et 14 novembre &agrave; 14h : Visites comment&eacute;es. Par Daniel Clauzier, co-commissaire de l&rsquo;exposition (le 17), H&eacute;l&egrave;ne Del&eacute;pine-Niobet, responsable du fonds iconographique de la M&eacute;diath&egrave;que (le 7) et Florent Palluault, responsable des<br />collections de conservation de la M&eacute;diath&egrave;que (le 14).&nbsp; A la M&eacute;diath&egrave;que Fran&ccedil;ois-Mitterrand. Gratuit</p><p>&nbsp;</p><p><em>Poitiers - MUSEE SAINTE-CROIX<br />3 bis RUE JEAN JAURES</em></p><p><p>Au Mus&eacute;e Sainte-Croix et &agrave; la M&eacute;diath&egrave;que Fran&ccedil;ois-Mitterrand</p></p>]]></description>
            <pubDate>Mon, 14 Sep 2015 00:00:00 GMT</pubDate>
            <guid isPermaLink="false">
                http://www.poitiers.fr/rss__0_0_Manifestation_21322__0__Images_revelees_Poitiers_a_l_epreuve_de_la_photographie_1839_1914_.html
            </guid>
            <enclosure
                    url="http://www.poitiers.fr/v25185_w-_Exposition_Images_revelees_Poitiers_a_lA_epreuve_de_la_photographie_1839_1914_.jpg"
                    type="image/jpeg" length="15534"/>
            <category>Agenda</category>
            <importance>une</importance>
            <c:date_debut type="date">2015-10-16</c:date_debut>
            <c:date_fin type="date">2016-01-17</c:date_fin>
        </item>
        <item>
            <author>webmaster@mairie-poitiers.fr</author>
            <title><![CDATA[Human de Yann Arthus-Bertrand  (CinÃ©ma)]]></title>
            <link>http://www.poitiers.fr/rss__0_0_Manifestation_21708__0__Human_de_Yann_Arthus_Bertrand.html</link>
            <description>
                <![CDATA[<p><strong>Le 15 Novembre</strong>&nbsp;&nbsp;</p><p><p>15h - salle th&eacute;&acirc;tre</p></p><h6>Les rendez-vous COP21 de Grand Poitiers</h6><p>Le film Human de Yann Arthus-Bertrand est projet&eacute; gratuitement le 15&nbsp;novembre 2015 &agrave; 15h au <a href="http://www.tap-poitiers.com/" target="_blank">Th&eacute;&acirc;tre Auditorium de Poitiers</a>, salle th&eacute;&acirc;tre*.</p><p>Alors que Paris va accueillir et pr&eacute;sider la COP 21, du 30 novembre au 11 d&eacute;cembre 2015, Grand Poitiers propose de nombreuses manifestations pour illustrer son engagement de longue date dans la transition &eacute;nerg&eacute;tique et lance son programme avec la projection gratuite du film de Yann Arthus-Bertrand.</p><p>&nbsp;</p><h4>Bande annonce</h4><p><iframe frameborder="0" scrolling="no" src="https://www.youtube.com/embed/ZXcTM71ydn0" style="width:100%;height:350px;"></iframe></p><p><em>Poitiers - THEATRE ET AUDITORIUM DE POITIERS<br />1 BOULEVARD DE VERDUN</em><br /><a href="mailto:accueilpublic@tap-poitiers.com" class="lienMAIL">accueilpublic@tap-poitiers.com</a><br /><a href="http://www.tap-poitiers.com" class="lienINTERNET" target="_blank">http://www.tap-poitiers.com</a></p><p><p><em>* Dans la limite des places disponibles</em></p><p>Pour en savoir plus : <a href="http://www.grandpoitiers.fr/c__243_987__Human.html" target="_blank">cop21.grandpoitiers.fr</a></p></p>]]></description>
            <pubDate>Wed, 28 Oct 2015 00:00:00 GMT</pubDate>
            <guid isPermaLink="false">
                http://www.poitiers.fr/rss__0_0_Manifestation_21708__0__Human_de_Yann_Arthus_Bertrand.html
            </guid>
            <enclosure url="http://www.poitiers.fr/v25404_w-_Les_rendez_vous_COP21_de_Grand_Poitiers_.png"
                       type="image/png" length="23048"/>
            <category>Agenda</category>
            <importance>une</importance>
            <c:date_debut type="date">2015-11-15</c:date_debut>
            <c:date_fin type="date">2015-11-15</c:date_fin>
        </item>
        <item>
            <author>webmaster@mairie-poitiers.fr</author>
            <title>
                <![CDATA[Â« Le Miroir hors les murs Â» : 1Ã¨re exposition Â« RÃªves Ã©veillÃ©s Â»  (Exposition artistique)]]></title>
            <link>
                http://www.poitiers.fr/rss__0_0_Manifestation_21337__0___Le_Miroir_hors_les_murs_1ere_exposition_Reves_eveilles_.html
            </link>
            <description>
                <![CDATA[<p><strong>Du 07 Octobre au 07 Novembre</strong>&nbsp;&nbsp;</p><p>Le projet de salle d&rsquo;arts visuels &laquo; Le Miroir &raquo;, dans l&rsquo;ancien th&eacute;&acirc;tre, se concr&eacute;tise avec la pr&eacute;sentation d&rsquo;une premi&egrave;re exposition, &laquo; hors les murs &raquo;, du 7 octobre au 7 novembre au <a href="http://www.tap-poitiers.com/" target="_blank">Th&eacute;&acirc;tre Auditorium de Poitiers</a> (TAP) : &laquo; R&ecirc;ves &eacute;veill&eacute;s &raquo;, dans le cadre des Rencontres Michel Foucault. Cette programmation refl&egrave;te d&#39;ores et d&eacute;j&agrave; la singularit&eacute; de ce nouveau lieu qui s&rsquo;ouvrira &agrave; toutes les formes d&rsquo;arts visuels : art contemporain, design, artisanat, arts d&eacute;coratifs, mode...</p><h4>&laquo; R&ecirc;ves &eacute;veill&eacute;s &raquo; : 8 &oelig;uvres expos&eacute;es au TAP, dont une de Jeff Koons</h4><p>Cette premi&egrave;re exposition qui a lieu au TAP, dans le cadre des Rencontres Michel Foucault, a pour th&egrave;me l&rsquo;enfance. Les &oelig;uvres choisies par Yannick Miloux, directeur artistique du <a href="http://fracartothequelimousin.fr/" target="_blank">Frac-artoth&egrave;que du Limousin</a> questionnent l&rsquo;enfance de fa&ccedil;on humoristique ou provocante, comme celle autour du personnage du Grand M&eacute;chant Loup ou une installation de sculptures en lien avec le mythe de Blanche-Neige.</p><p>Ces &oelig;uvres proviennent des Fonds r&eacute;gionaux d&#39;art contemporain du Limousin, du Poitou-Charentes et de l&rsquo;Aquitaine, en &eacute;cho &agrave; la mise en place de la nouvelle r&eacute;gion.</p><p>Le <strong>vernissage de l&rsquo;exposition a lieu le 8 octobre au TAP, avec une visite guid&eacute;e de Yannick Miloux</strong>.</p><p>Des visites comment&eacute;es gratuites de l&rsquo;exposition ont lieu au TAP :</p><ul><li><p>Les 15 et 22 octobre &agrave; 12h30 avec les Beaux-arts, &eacute;cole d&rsquo;arts plastiques.</p></li><li><p>Les 20 octobre et 3 novembre &agrave; 18h30 avec les Beaux-arts, &eacute;cole d&rsquo;arts plastiques.</p></li><li><p>Le 5 novembre &agrave; 12h30 avec Yannick Miloux.</p></li><li><p>Le 7 novembre &agrave; 19h avec les Beaux-arts, &eacute;cole d&rsquo;arts plastiques</p></li></ul><h4>Pour en savoir plus</h4><p>Sur <a href="http://www.tap-poitiers.com/les-rencontres-michel-foucault-1380" target="_blank">Les Rencontres Michel Foucaut au TAP</a></p><p><a href="http://www.tap-poitiers.com/" target="_blank">Th&eacute;&acirc;tre Auditorium de Poitiers (TAP</a><strong>)</strong><br />1 boulevard de Verdun<br />86000 Poitiers</p><p>&nbsp;</p><p>&nbsp;</p><p><em>Poitiers - THEATRE ET AUDITORIUM DE POITIERS<br />1 BOULEVARD DE VERDUN</em><br /><a href="mailto:accueilpublic@tap-poitiers.com" class="lienMAIL">accueilpublic@tap-poitiers.com</a><br /><a href="http://www.tap-poitiers.com" class="lienINTERNET" target="_blank">http://www.tap-poitiers.com</a></p>]]></description>
            <pubDate>Tue, 15 Sep 2015 00:00:00 GMT</pubDate>
            <guid isPermaLink="false">
                http://www.poitiers.fr/rss__0_0_Manifestation_21337__0___Le_Miroir_hors_les_murs_1ere_exposition_Reves_eveilles_.html
            </guid>
            <enclosure url="http://www.poitiers.fr/v24830_w-_Exposition_Reves_eveilles.jpg" type="image/jpeg"
                       length="13489"/>
            <category>Agenda</category>
            <importance>exclu</importance>
            <c:date_debut type="date">2015-10-07</c:date_debut>
            <c:date_fin type="date">2015-11-07</c:date_fin>
        </item>
        
    </channel>
</rss>
```


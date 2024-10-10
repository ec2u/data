# Sites

* https://www.univ-poitiers.fr/c/actualites/
  * University of Poitiers / News and Events
  * Université de Poitiers / Actualités et événements
* https://www.univ-poitiers.fr/flux-rss/

# API

* https://www.univ-poitiers.fr/feed
* https://www.univ-poitiers.fr/feed/ec2u

WordPress RSS feeds with custom fields

# Integration

* custom RSS adapter

## 2024-04-24

* extend to https://www.univ-poitiers.fr/feed
* fix location IRI generation

## 2022-05-30

* updated RSS feed URL
* extract `schema:image`

## 2022-05-20

* migrated to custom RSS adapter to take advantage of extended custom fields

# Content

* `schema:url`
* `schema:image`
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
GET https://www.univ-poitiers.fr/feed/ec2u
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        
        <title>Université de Poitiers - Feed</title>
        <atom:link href="https://www.univ-poitiers.fr/feed/ec2u" rel="self" type="application/rss+xml"/>
        <link>https://www.univ-poitiers.fr</link>
        <description></description>
        <lastBuildDate>Mon, 30 May 2022 07:55:38 +0000</lastBuildDate>
        <language></language>
        <sy:updatePeriod>hourly</sy:updatePeriod>
        <sy:updateFrequency>1</sy:updateFrequency>

        <item>
            <title>Sorties sportives</title>
            <link>https://www.univ-poitiers.fr/sorties-sportives/</link>
            <date_from>01/05/2022</date_from>
            <date_to>24/06/2022</date_to>
            <hour_from></hour_from>
            <hour_to></hour_to>

            <pubDate>Fri, 29 Apr 2022 13:25:23 +0000</pubDate>
            <dc:creator>jmurguet</dc:creator>
            <guid isPermaLink="false">https://www.univ-poitiers.fr/?p=102290</guid>
            <description>
                <![CDATA[
						[01/05/2022 to 24/06/2022						] 												En même temps que les beaux jours, les stages du suaps sont de retour ! 

Attention les places sont limitées ! 						<img width="800" height="450" src="https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2020/07/img-suaps.jpg" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="SUAPS" loading="lazy" srcset="https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2020/07/img-suaps.jpg 800w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2020/07/img-suaps-300x169.jpg 300w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2020/07/img-suaps-768x432.jpg 768w" sizes="(max-width: 800px) 100vw, 800px" />						]]>
            </description>
            <content:encoded><![CDATA[En même temps que les beaux jours, les stages du suaps sont de retour ! 

Attention les places sont limitées ! ]]></content:encoded>
            <image>https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2020/07/img-suaps.jpg</image>
        </item>
        <item>
            <title>Une École d’été pour accueillir et accompagner les étudiants ou futurs étudiants venant d’Ukraine (du
                16 mai au 26 juin)
            </title>
            <link>
                https://www.univ-poitiers.fr/une-ecole-dete-pour-accueillir-et-accompagner-les-etudiants-ou-futurs-etudiants-venant-dukraine-du-16-mai-au-24-juin/
            </link>
            <date_from>16/05/2022</date_from>
            <date_to>26/06/2022</date_to>
            <hour_from></hour_from>
            <hour_to></hour_to>

            <pubDate>Wed, 27 Apr 2022 12:21:04 +0000</pubDate>
            <dc:creator>spivette</dc:creator>
            <guid isPermaLink="false">https://www.univ-poitiers.fr/?p=102199</guid>
            <description>
                <![CDATA[
						[16/05/2022 to 26/06/2022						] 												A partir du 16 mai et jusqu’au 26 juin, l’université de Poitiers organise une Ecole d’été gratuite « Welcome to Poitiers » pour accueillir et accompagner les étudiants ou futurs étudiants venant d’Ukraine : initiation au français, découverte de l’université, de la ville de Poitiers, ateliers de discussion et d’intégration dans la vie quotidienne française et activités sportives ou culturelles – de nombreux partenaires se mobilisent pour un été festif, solidaire et de partage.						<img width="1500" height="1038" src="https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/04/img-univ-ete.jpg" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Une École d’été pour accueillir et accompagner les étudiants ou futurs étudiants venant d’Ukraine (du 16 mai au 24 juin)" loading="lazy" srcset="https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/04/img-univ-ete.jpg 1500w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/04/img-univ-ete-300x208.jpg 300w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/04/img-univ-ete-1024x709.jpg 1024w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/04/img-univ-ete-768x531.jpg 768w" sizes="(max-width: 1500px) 100vw, 1500px" />						]]>
            </description>
            <content:encoded>
                <![CDATA[A partir du 16 mai et jusqu’au 26 juin, l’université de Poitiers organise une Ecole d’été gratuite « Welcome to Poitiers » pour accueillir et accompagner les étudiants ou futurs étudiants venant d’Ukraine : initiation au français, découverte de l’université, de la ville de Poitiers, ateliers de discussion et d’intégration dans la vie quotidienne française et activités sportives ou culturelles – de nombreux partenaires se mobilisent pour un été festif, solidaire et de partage.]]></content:encoded>
            <image>https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/04/img-univ-ete.jpg</image>
        </item>
        <item>
            <title>Expérience virtuelle de sensibilisation sur les violences sexistes et sexuelles</title>
            <link>
                https://www.univ-poitiers.fr/experience-virtuelle-de-sensibilisation-sur-les-violences-sexistes-et-sexuelles/
            </link>
            <date_from>31/05/2022</date_from>
            <date_to>31/05/2022</date_to>
            <hour_from></hour_from>
            <hour_to></hour_to>

            <pubDate>Tue, 24 May 2022 08:24:57 +0000</pubDate>
            <dc:creator>spivette</dc:creator>
            <guid isPermaLink="false">https://www.univ-poitiers.fr/?p=102851</guid>
            <description>
                <![CDATA[
						[31/05/2022 to 31/05/2022						 - 14h  à 17h						 - Campus de Poitiers - Maison des étudiants (Bâtiment 6)]												<img width="1249" height="684" src="https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/05/img-virtuel.jpg" class="attachment-post-thumbnail size-post-thumbnail wp-post-image" alt="Expérience virtuelle sur les violences sexistes et sexuelles" loading="lazy" srcset="https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/05/img-virtuel.jpg 1249w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/05/img-virtuel-300x164.jpg 300w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/05/img-virtuel-1024x561.jpg 1024w, https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/05/img-virtuel-768x421.jpg 768w" sizes="(max-width: 1249px) 100vw, 1249px" />						]]>
            </description>
            <content:encoded><![CDATA[]]></content:encoded>
            <image>https://www.univ-poitiers.fr/wp-content/uploads/sites/10/2022/05/img-virtuel.jpg</image>
        </item>
       
    </channel>
</rss>
```


# Site

* https://360.uaic.ro/blog/category/evenimente/
  * University of Iasi / 360 Events
  * Universitatea din Iași / 360 Evenimente

# API

* RSS
  * https://360.uaic.ro/feed
  * WordPress

# Integration

* standard WordPres/RSS adpater

## 2022-07-18

* Extended to handle both `encoded` and `decription` elements
* Fix decoding of HTML entities

# Samples

```http
GET https://360.uaic.ro/feed
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:wfw="http://wellformedweb.org/CommentAPI/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
     xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
>

    <channel>
        <title>360 UAIC</title>
        <atom:link href="https://360.uaic.ro/feed/" rel="self" type="application/rss+xml"/>
        <link>https://360.uaic.ro</link>
        <description>Noutăţi Opinii Evenimente</description>
        <lastBuildDate>
            Thu, 14 Jul 2022 12:15:47 +0000
        </lastBuildDate>
        <language>ro-RO</language>
        <sy:updatePeriod>
            hourly
        </sy:updatePeriod>
        <sy:updateFrequency>
            1
        </sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.1.13</generator>

        <image>
            <url>https://360.uaic.ro/wp-content/uploads/2016/08/cropped-360_color.jpg-32x32.png</url>
            <title>360 UAIC</title>
            <link>https://360.uaic.ro</link>
            <width>32</width>
            <height>32</height>
        </image>
        <item>
            <title>Basware Iasi caută vorbitori de limba franceză sau germană</title>
            <link>https://360.uaic.ro/blog/2022/07/14/basware-iasi-cauta-vorbitori-de-limba-franceza-sau-germana/</link>
            <pubDate>Thu, 14 Jul 2022 12:15:47 +0000</pubDate>
            <dc:creator><![CDATA[Media]]></dc:creator>
            <category><![CDATA[Carieră]]></category>

            <guid isPermaLink="false">http://360.uaic.ro/?p=26716</guid>
            <description>
                <![CDATA[Basware Iasi caută vorbitori de limba franceză sau germană pentru un proiect de application support. Descriere: &#8211; volumetrie scazută de apeluri &#8211; proceduri pentru fiecare scenariu în parte &#8211; regim de lucru hibrid (3 zile de acasă, 2 de la birou) &#8211; program L-V 09:00 &#8211; 18:00 &#8211; career path definit &#8211; nu exista cerinte [&#8230;]]]></description>
        </item>
        <item>
            <title>Colocviul internațional InterCulturalia</title>
            <link>https://360.uaic.ro/blog/2022/07/13/colocviul-international-interculturalia/</link>
            <pubDate>Wed, 13 Jul 2022 05:57:53 +0000</pubDate>
            <dc:creator><![CDATA[Media]]></dc:creator>
            <category><![CDATA[Noutăţi]]></category>

            <guid isPermaLink="false">http://360.uaic.ro/?p=26709</guid>
            <description>
                <![CDATA[INTERCULTURALIA &#8211; Colocviu internațional pentru studenți și tineri cercetători  Ediția a V-a: THE MAKING OF HUMANITIES: FROM PRINT TO DIGITAL / LA FABRIQUE DES HUMANITÉS : DE L’IMPRIMÉ AU NUMÉRIQUE / DAS SCHAFFEN DER GEISTESWISSENSCHAFTEN: VOM GEDRUCKTEN ZUM DIGITALEN   (14-15 octombrie 2022, Iași, România) Apel la comunicări English Français Deutsch Catedrele de Engleză, Franceză și [&#8230;]]]></description>
        </item>
        <item>
            <title>Programul Hella Tech Camp</title>
            <link>https://360.uaic.ro/blog/2022/07/07/programul-hella-tech-camp/</link>
            <pubDate>Thu, 07 Jul 2022 09:14:46 +0000</pubDate>
            <dc:creator><![CDATA[Media]]></dc:creator>
            <category><![CDATA[Noutăţi]]></category>

            <guid isPermaLink="false">http://360.uaic.ro/?p=26706</guid>
            <description>
                <![CDATA[Compania HELLA România organizează, la sfârșitul acestei veri, Programul HELLA Tech Camp, adresat studenților din ani terminali de la profilul informatică. Cinci tineri vor fi selectați din Iași pentru a participa, în perioada 29 august – 9 septembrie 2022, la o experiență de lucru și distracție la Timișoara. Studenții îi vor cunoaște pe specialiștii centrului [&#8230;]]]></description>
        </item>
  
    </channel>
</rss>

```


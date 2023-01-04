# Site

* https://www.salamanca.com/actividades-eventos-propuestas-agenda-salamanca/
  * SACIS - Salamanca Cooperative Society of Social Initiative
  * SACIS - Salamanca Sociedad Cooperativa de Iniciativa Social

# API

- RSS
  * https://www.salamanca.com/events/feed/
  * WordPress + https://www.myeventon.com/

# Integration

* custom RSS adapter

## Pending

* ask tech contact to improve RSS using  https://www.myeventon.com/addons/rss-feed/

## 2022-05-26

* initial integration

# Content

* `schema:url`
* `schema:name`
* `schema:description`

# Samples

```http
GET https://www.salamanca.com/events/feed/ 
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">

    <channel>
        <title>Events &#8211; Salamanca.com</title>
        <atom:link href="https://www.salamanca.com/events/feed/" rel="self" type="application/rss+xml"/>
        <link>https://www.salamanca.com</link>
        <description>Cultura, ocio, turismo... Todo sobre Salamanca</description>
        <lastBuildDate>Mon, 23 May 2022 22:36:07 +0000</lastBuildDate>
        <language>es</language>
        <sy:updatePeriod>hourly</sy:updatePeriod>
        <sy:updateFrequency>1</sy:updateFrequency>
        <generator>https://wordpress.org/?v=4.9.20</generator>
        
        <item>
            <title>Casino de Salamanca La caverna de Platón y la Cirugía Mayo 2022</title>
            <link>https://www.salamanca.com/events/casino-de-salamanca-la-caverna-de-platon-y-la-cirugia-mayo-2022/
            </link>
            <pubDate>Mon, 23 May 2022 22:33:01 +0000</pubDate>
            <dc:creator><![CDATA[Salamanca.com]]></dc:creator>

            <guid isPermaLink="false">
                http://www.salamanca.com/events/casino-de-salamanca-la-caverna-de-platon-y-la-cirugia-mayo-2022/
            </guid>
            <description><![CDATA[<p>Casino de Salamanca La caverna de Platón y la Cirugía Mayo 2022 Alberto Gómez Alonso. Entrada libre hasta completar el aforo.</p>
<p>La entrada <a rel="nofollow" href="https://www.salamanca.com/events/casino-de-salamanca-la-caverna-de-platon-y-la-cirugia-mayo-2022/">Casino de Salamanca La caverna de Platón y la Cirugía Mayo 2022</a> se publicó primero en <a rel="nofollow" href="https://www.salamanca.com">Salamanca.com</a>.</p>
]]></description>
        </item>
        <item>
            <title>Puerta de Zamora Día Nacional de la Epilepsia Salamanca Mayo 2022</title>
            <link>https://www.salamanca.com/events/puerta-de-zamora-dia-nacional-de-la-epilepsia-salamanca-mayo-2022/
            </link>
            <pubDate>Mon, 23 May 2022 22:24:52 +0000</pubDate>
            <dc:creator><![CDATA[Salamanca.com]]></dc:creator>

            <guid isPermaLink="false">
                http://www.salamanca.com/events/puerta-de-zamora-dia-nacional-de-la-epilepsia-salamanca-mayo-2022/
            </guid>
            <description><![CDATA[<p>Puerta de Zamora Día Nacional de la Epilepsia Salamanca Mayo 2022 Asociación de Personas con Epilepsia de Castilla y León Aspecyl. Muévete por la Epilepsia. Iluminación de la fuente en color naranja.</p>
<p>La entrada <a rel="nofollow" href="https://www.salamanca.com/events/puerta-de-zamora-dia-nacional-de-la-epilepsia-salamanca-mayo-2022/">Puerta de Zamora  Día Nacional de la Epilepsia Salamanca Mayo 2022</a> se publicó primero en <a rel="nofollow" href="https://www.salamanca.com">Salamanca.com</a>.</p>
]]></description>
        </item>
        <item>
            <title>Plaza de los Bandos Jornada de Donación de Sangre Salamanca 24 de mayo de 2022</title>
            <link>
                https://www.salamanca.com/events/plaza-de-los-bandos-jornada-de-donacion-de-sangre-salamanca-24-de-mayo-de-2022/
            </link>
            <pubDate>Mon, 23 May 2022 22:17:22 +0000</pubDate>
            <dc:creator><![CDATA[Salamanca.com]]></dc:creator>

            <guid isPermaLink="false">
                http://www.salamanca.com/events/plaza-de-los-bandos-jornada-de-donacion-de-sangre-salamanca-24-de-mayo-de-2022/
            </guid>
            <description><![CDATA[<p>Plaza de los Bandos Jornada de Donación de Sangre Salamanca 24 de mayo de 2022 Autobús de Donación. De 10:00 a 13:00 y de 15:30 a 21:15.</p>
<p>La entrada <a rel="nofollow" href="https://www.salamanca.com/events/plaza-de-los-bandos-jornada-de-donacion-de-sangre-salamanca-24-de-mayo-de-2022/">Plaza de los Bandos Jornada de Donación de Sangre Salamanca 24 de mayo de 2022</a> se publicó primero en <a rel="nofollow" href="https://www.salamanca.com">Salamanca.com</a>.</p>
]]></description>
        </item>
 
    </channel>
    
</rss>
```


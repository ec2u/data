# Site

* https://academica.pt/
  * Associação Académica de Coimbra (AAC) / Agenda de Eventos
  * Academic Association of Coimbra (AAC) / Calendar of Events

# Integration

N/A

# Content

N/A

# API

## ~~WordPress Event Calendar API~~

* 2022-07-29 Returns an empty event list

```http
GET https://academica.pt/wp-json/tribe/events/v1/events/
```

```json
{
    "events": [ ],
    "rest_url": "https:\/\/academica.pt\/wp-json\/tribe\/events\/v1\/events\/?page=1&per_page=10&start_date=2022-07-29 00:00:00&end_date=2024-07-29 23:59:59&status=publish",
    "total": 0,
    "total_pages": 0
}
```

## ~~RSS~~

* 2022-07-29 Returns a generic WordPress welcome event

```http
GET https://academica.pt/feed/
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

     xmlns:georss="http://www.georss.org/georss"
     xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
>

    <channel>
        <title>AAC</title>
        <atom:link href="https://academica.pt/feed/" rel="self" type="application/rss+xml"/>
        <link>https://academica.pt</link>
        <description>Associação Académica de Coimbra</description>
        <lastBuildDate>Thu, 13 Feb 2020 10:11:08 +0000</lastBuildDate>
        <language>en-US</language>
        <sy:updatePeriod>
            hourly
        </sy:updatePeriod>
        <sy:updateFrequency>
            1
        </sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.8.4</generator>

        <image>
            <url>https://academica.pt/wp-content/uploads/2020/09/cropped-cropped-favicon-1-32x32.png</url>
            <title>AAC</title>
            <link>https://academica.pt</link>
            <width>32</width>
            <height>32</height>
        </image>
        <item>
            <title>Hello world!</title>
            <link>https://academica.pt/hello-world/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=hello-world
            </link>
            <comments>https://academica.pt/hello-world/#respond</comments>

            <dc:creator><![CDATA[admin]]></dc:creator>
            <pubDate>Thu, 13 Feb 2020 10:11:08 +0000</pubDate>
            <category><![CDATA[Uncategorized]]></category>
            <guid isPermaLink="false">http://academica.pt/?p=1</guid>

            <description>
                <![CDATA[Welcome to WordPress. This is your first post. Edit or delete it, then start writing!]]></description>
            <content:encoded><![CDATA[
<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>
]]></content:encoded>

            <wfw:commentRss>https://academica.pt/hello-world/feed/</wfw:commentRss>
            <slash:comments>0</slash:comments>


        </item>
    </channel>
</rss>
```

## ~~iCal~~

* 2022-07-29 Returns an empty `text/html` document

```http
GET https://academica.pt/eventsteste1/?ical=1
```

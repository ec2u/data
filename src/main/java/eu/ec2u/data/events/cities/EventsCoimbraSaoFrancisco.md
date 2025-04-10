# Site

* https://www.coimbraconvento.pt/pt/agenda/
    * Convento São Francisco / Agenda Cultural
    * San Francisco Convent / Cultural Agenda

# Integration

* currently reported through [Coimbra City Council / CoimbrAgenda](EventsCoimbraCity.md)
* possible direct integration through JSON-LD once syntax errors are fixed

# Content

N/A

# API

## JSON-LD

* embedded both at catalog and details level
    * same factual data
    * different images (catalog images are cropped versions of details images)
* **description fields are malformed**
    * double quotes in HTML attributes are not escaped, breaking JSON syntax

### Catalog

* progressive event loading with infinite scroll
    * embedded JSON-LD apparently covers all available events

```http
GET https://www.coimbraconvento.pt/pt/agenda/
```

```html

<script type="application/ld+json">
    [
        {
      "@context": "https://schema.org",
      "@type": "DanceEvent",
      "name": "A Voz do Mundo II",
        "image": "http://www.coimbraconvento.pt/fotos/eventos/01_72722528662cbe9d1274ba.jpg",
        "url": "http://www.coimbraconvento.pt/pt/agenda/a-voz-do-mundo-ii/",
        "startDate": "2022-07-27T15:00",
              "endDate": "2022-09-04T15:00",
              "description": "<div><div><span style="color: rgb(204, 0, 23);">Dar a Ouvir. Paisagens Sonoras da Cidade.&nbsp;</span></div><div>Coorganização: Câmara Municipal de Coimbra/ Convento São Francisco e Serviço Educativo do Jazz ao Centro Clube.</div></div><div><br /></div><div><br /></div><div><div><br /></div><div>Gratuito<br /><br /><br />&copy; DR</div></div>            ",
            "location": {
        "@type": "Place",
        "sameAs" : "http://www.coimbraconvento.pt",
        "name": "Coimbra Cultura e Congressos - Convento São Francisco",
        "address": "Avenida da Guarda Inglesa, nº 1A 3040 193 Santa Clara, Coimbra"
      }
      }
            ,
    
            ]

</script>
```

```json
[
  {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    "name": "A Voz do Mundo II",
    "image": "http://www.coimbraconvento.pt/fotos/eventos/01_72722528662cbe9d1274ba.jpg",
    "url": "http://www.coimbraconvento.pt/pt/agenda/a-voz-do-mundo-ii/",
    "startDate": "2022-07-27T15:00",
    "endDate": "2022-09-04T15:00",
    "description": "<div><div><span style="
    color: rgb(204,
    0,
    23)
    ;
    ">Dar a Ouvir. Paisagens Sonoras da Cidade.&nbsp;</span></div><div>Coorganização: Câmara Municipal de Coimbra/ Convento São Francisco e Serviço Educativo do Jazz ao Centro Clube.</div></div><div><br /></div><div><br /></div><div><div><br /></div><div>Gratuito<br /><br /><br />&copy; DR</div></div>            ",
    "location": {
      "@type": "Place",
      "sameAs": "http://www.coimbraconvento.pt",
      "name": "Coimbra Cultura e Congressos - Convento São Francisco",
      "address": "Avenida da Guarda Inglesa, nº 1A 3040 193 Santa Clara, Coimbra"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    "name": "Actants, Tomás Quintais",
    "image": "http://www.coimbraconvento.pt/fotos/eventos/01_86246381862c44109819df.jpg",
    "url": "http://www.coimbraconvento.pt/pt/agenda/actants-tomas-quintais/",
    "startDate": "2022-07-27T15:00",
    "endDate": "2022-09-04T15:00",
    "description": "<div><div><span style="
    color: rgb(204,
    0,
    23)
    ;
    ">Dar a Ouvir. Paisagens Sonoras da Cidade.&nbsp;</span></div><div>Coorganização: Câmara Municipal de Coimbra/ Convento São Francisco e Serviço Educativo do Jazz ao Centro Clube.</div></div><div><br /></div><div><br /></div><div><div>Quarta a segunda |15h00 às 20h00 (última entrada às 19h30)</div><div><br /></div><div>Gratuito<br /><br /><br />&copy; DR</div></div>      ",
    "location": {
      "@type": "Place",
      "sameAs": "http://www.coimbraconvento.pt",
      "name": "Coimbra Cultura e Congressos - Convento São Francisco",
      "address": "Avenida da Guarda Inglesa, nº 1A 3040 193 Santa Clara, Coimbra"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    "name": "Cantus Discantus II, Tomás Quintais",
    "image": "http://www.coimbraconvento.pt/fotos/eventos/01_147167616762cbea650c7af.jpg",
    "url": "http://www.coimbraconvento.pt/pt/agenda/cantus-discantus-ii-tomas-quintais/",
    "startDate": "2022-07-27T15:00",
    "endDate": "2022-09-04T15:00",
    "description": "<div><span style="
    color: rgb(204,
    0,
    23)
    ;
    ">Dar a Ouvir. Paisagens Sonoras da Cidade.&nbsp;</span></div><div>Coorganização: Câmara Municipal de Coimbra/ Convento São Francisco e Serviço Educativo do Jazz ao Centro Clube.</div><div><br /></div><div><br /></div><div>Quarta a segunda | 15h00 às 20h00 (última entrada às 19h30)</div><div><br /></div><div>Gratuito</div><div><br /></div><div><br /></div><div>&copy; DR</div>    ",
    "location": {
      "@type": "Place",
      "sameAs": "http://www.coimbraconvento.pt",
      "name": "Coimbra Cultura e Congressos - Convento São Francisco",
      "address": "Avenida da Guarda Inglesa, nº 1A 3040 193 Santa Clara, Coimbra"
    }
  }
]

```

## RSS Feed

* minimal metadata
* no dates

```http
GET https://www.coimbraconvento.pt/eventos/rss.php
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="/plugins/xml/format.xsl"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <atom:link href="https://www.coimbraconvento.pt/pt/eventos/rss.php"
                rel="self" type="application/rss+xml"/>
        <title>Coimbra Cultura e Congressos - Convento SÃ£o Francisco</title>
        <link>https://www.coimbraconvento.pt</link>
        <description>
            <![CDATA[O Convento SÃ£o Francisco constitui-se como o local de excelÃªncia para a realizaÃ§Ã£o de congressos, colÃ³quios e eventos corporativos, nacionais e internaciona]]></description>
        <language>pt</language>
        <item>
            <title><![CDATA[A Voz do Mundo II]]></title>
            <link><![CDATA[https://www.coimbraconvento.pt/pt/agenda/a-voz-do-mundo-ii/]]></link>
            <guid isPermaLink="false"><![CDATA[5eb3ad06f2ecaf4727ef9a10aeadf18e]]></guid>
            <description>
                <![CDATA[<img src="https://www.coimbraconvento.pt/fotos/eventos/01_72722528662cbe9d1274ba.jpg" border="0" align="right" />Dar a Ouvir. Paisagens Sonoras da Cidade.&nbsp;CoorganizaÃ§Ã£o: CÃ¢mara Municipal de Coimbra/ Convento SÃ£o Francisco e ServiÃ§o Educativo do Jazz ao Centro Clube.<br /><br /><br />Gratuito<br /><br /><br />&copy; DR            ]]></description>
            <dc:subject><![CDATA[A Voz do Mundo II]]></dc:subject>
            <dc:creator><![CDATA[]]></dc:creator>
            <dc:date><![CDATA[]]></dc:date>
        </item>
        <item>
            <title><![CDATA[Actants, TomÃ¡s Quintais]]></title>
            <link><![CDATA[https://www.coimbraconvento.pt/pt/agenda/actants-tomas-quintais/]]></link>
            <guid isPermaLink="false"><![CDATA[e2da8b79eb51d38863b90883a00dfe17]]></guid>
            <description>
                <![CDATA[<img src="https://www.coimbraconvento.pt/fotos/eventos/01_86246381862c44109819df.jpg" border="0" align="right" />Dar a Ouvir. Paisagens Sonoras da Cidade.&nbsp;CoorganizaÃ§Ã£o: CÃ¢mara Municipal de Coimbra/ Convento SÃ£o Francisco e ServiÃ§o Educativo do Jazz ao Centro Clube.<br /><br />Quarta a segunda |15h00 Ã s 20h00 (Ãºltima entrada Ã s 19h30)<br />Gratuito<br /><br /><br />&copy; DR      ]]></description>
            <dc:subject><![CDATA[Actants, TomÃ¡s Quintais]]></dc:subject>
            <dc:creator><![CDATA[]]></dc:creator>
            <dc:date><![CDATA[]]></dc:date>
        </item>
        <item>
            <title><![CDATA[Cantus Discantus II, TomÃ¡s Quintais]]></title>
            <link><![CDATA[https://www.coimbraconvento.pt/pt/agenda/cantus-discantus-ii-tomas-quintais/]]></link>
            <guid isPermaLink="false"><![CDATA[d073647b8b4f27711bd4f6fe7b48afa0]]></guid>
            <description>
                <![CDATA[<img src="https://www.coimbraconvento.pt/fotos/eventos/01_147167616762cbea650c7af.jpg" border="0" align="right" />Dar a Ouvir. Paisagens Sonoras da Cidade.&nbsp;CoorganizaÃ§Ã£o: CÃ¢mara Municipal de Coimbra/ Convento SÃ£o Francisco e ServiÃ§o Educativo do Jazz ao Centro Clube.<br /><br />Quarta a segunda | 15h00 Ã s 20h00 (Ãºltima entrada Ã s 19h30)<br />Gratuito<br /><br />&copy; DR    ]]></description>
            <dc:subject><![CDATA[Cantus Discantus II, TomÃ¡s Quintais]]></dc:subject>
            <dc:creator><![CDATA[]]></dc:creator>
            <dc:date><![CDATA[]]></dc:date>
        </item>
    </channel>
</rss>
```

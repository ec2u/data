# Sites

* https://www.uni-jena.de/en/study-programme

# Integration

* program catalog
  * scraped from main site page

* program details
  * page-level JSON-LD + **scheme:AboutPage** metadata
  * no detailed **schema:EducationalOccupationalProgram **description

## 2024-04-03

* fix root XPath crawling expression

## 2023-03-02

* Initial integration

# Samples

```http
GET https://www.uni-jena.de/en/bsc-applied-computer-science
```

```json
<script type="application/ld+json">
{
    "@context": "https:\/\/schema.org",
    "@type": "AboutPage",
    "headline": "Applied Computer Science",
    "abstract": "How can computing and communication systems be further developed? Where can augmented reality be used in the working world? And how are complex problems solved with algorithmic building blocks? If you find these questions interesting, then you have come to the right place!",
    "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https:\/\/www.uni-jena.de\/unijenamedia\/studium\/studienangebot\/fak-mi\/informatik\/roboter.jpg?height=911&width=1620",
        "description": "Student controls a robotic arm",
        "author": {
            "@type": "Person",
            "name": "Sebastian Reuter"
        }
    },
    "dateCreated": "2020-12-11T10:36:43+01:00",
    "lastReviewed": "2023-02-13T14:31:55+01:00",
    "inLanguage": "en-GB",
    "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "item": {
                    "@id": "https:\/\/www.uni-jena.de\/en",
                    "name": "Home"
                }
            },
            {
                "@type": "ListItem",
                "position": 2,
                "item": {
                    "@id": "https:\/\/www.uni-jena.de\/en\/studies",
                    "name": "Studies"
                }
            },
            {
                "@type": "ListItem",
                "position": 3,
                "item": {
                    "@id": "https:\/\/www.uni-jena.de\/en\/study-programme",
                    "name": "Study programme"
                }
            }
        ]
    },
    "url": "https:\/\/www.uni-jena.de\/en\/bsc-applied-computer-science",
    "speakable": "https:\/\/www.uni-jena.de\/en\/bsc-applied-computer-science#block_body_0",
    "reviewedBy": {
        "@type": "Organization",
        "name": "Division 1 – Student Affairs"
    },
    "alternativeHeadline": "Applied Computer Science, Bachelor of Science",
    "educationalLevel": "Bachelor of Science",
    "audience": {
        "@type": "Audience",
        "name": "Studieninteressierte"
    }
}
</script>
```


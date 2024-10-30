# Integration

* Basic data extracted from the
  public [ESSE3 API](https://studentionline.unipv.it/e3rest/docs/?urls.primaryName=Offerta%20Api%20V1%20(https%3A%2F%2Fstudentionline.unipv.it%2Fe3rest%2Fapi%2Fofferta-service-v1))
* Extended data extracted from internal UGov APIs

## 2024-10-31

* UGov integration
*

## 2024-10-30

* migration to ESSE3

# Samples

## Programs (ESSE3)

```http
GET https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/?aaOffId=2024&start=0&limit=100
```

## Courses (ESSE3)

```http
GET https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/2024/10138/attivita?start=0&limit=100
```

## Course Details (UGov)

```http
POST {offerings-pavia-url}
Accept: application/xml
Authorization: Basic {offerings-pavia-usr}:{offerings-pavia-pwd}
```

```xml

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.di.u-gov.cineca.it/">
    <soapenv:Header/>
    <soapenv:Body>
        <ws:ProgrammazioneDidattica>
            <parametriEsportazioneProgrammazioneDidattica>
                <aaOffId>2023</aaOffId>
                <cdsCod>32400</cdsCod>
            </parametriEsportazioneProgrammazioneDidattica>
        </ws:ProgrammazioneDidattica>
    </soapenv:Body>
</soapenv:Envelope>
```


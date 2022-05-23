# Site

* https://www.coimbragenda.pt/
  * Câmara Municipal de Coimbra / CoimbrAgenda
  * Coimbra City Council / CoimbrAgenda

# API

* https://www.coimbragenda.pt/api/v1/event/

# Integration

*

# Content

* url
  * https://www.coimbragenda.pt/#!/category/5b87f593001ccf7ba801fae4/event/62629212ea7bb405c58e3c53
    * category id + event id

* image
  * https://www.coimbragenda.pt/api/v1/file/62629213ea7bb405c58e3c55

# Pending

* initial integration

# Upgrades

## 2022-05-23

*

# Samples

```http
GET https://www.coimbragenda.pt/api/v1/event/filter?limit=100&page=1
Accept: application/json
```

```json
{
    "success": true,
    "message": "Success",
    "data": {
        "docs": [
            {
                "_id": "62629212ea7bb405c58e3c53",
                "updatedAt": "2022-04-22T11:31:31.066Z",
                "createdAt": "2022-04-22T11:31:30.329Z",
                "createdBy": "5d1b23ea03be5b66f4fded6f",
                "websiteTickets": "https://www.coimbraconvento.pt/pt/agenda/conchas-d-orfeu-ac-e-marionetas-de-mandragora/",
                "ageRange": "Bebés, dos 0 aos 5 anos e acompanhantes",
                "phone": "239857191",
                "email": "bilheteira@coimbraconvento.pt",
                "endDate": "2022-05-23T00:00:00.000Z",
                "startDate": "2022-05-22T00:00:00.000Z",
                "highlighted": false,
                "codename": "Conchas - d'Orfeu AC e Marionetas de Mandrágora",
                "categories": [
                    {
                        "_id": "5b87f593001ccf7ba801fae4",
                        "updatedAt": "2019-07-03T11:47:42.362Z",
                        "createdAt": "2018-08-30T13:48:03.357Z",
                        "codename": "Convento São Francisco",
                        "color": "#4b6584",
                        "order": 6,
                        "image": "5b87f69c001ccf7ba801fae8",
                        "languageObjects": [
                            {
                                "title": "Convento São Francisco",
                                "language": "59a02bfadf3177197fa5120f",
                                "_id": "5b87f593001ccf7ba801fae5"
                            }
                        ],
                        "isMainCategory": true
                    },
                    {
                        "_id": "59a6d7244bd58e793f5d0842",
                        "updatedAt": "2019-07-03T11:47:42.368Z",
                        "createdAt": "2017-08-30T15:17:56.292Z",
                        "codename": "Música",
                        "color": "#2bcbba",
                        "order": 7,
                        "image": "5a5e2c4f59dd441bec5e2b17",
                        "languageObjects": [
                            {
                                "title": "Música",
                                "language": "59a02bfadf3177197fa5120f",
                                "_id": "59a6d7244bd58e793f5d0843"
                            }
                        ],
                        "isMainCategory": true
                    }
                ],
                "place": {
                    "longitude": null,
                    "latitude": null
                },
                "profileImage": {
                    "_id": "62629213ea7bb405c58e3c55",
                    "updatedAt": "2022-04-22T11:31:31.063Z",
                    "createdAt": "2022-04-22T11:31:31.063Z",
                    "originalName": "SiteCM.png"
                },
                "endHour": 600,
                "startHour": 960,
                "languageObjects": [
                    {
                        "title": "Conchas - d'Orfeu AC e Marionetas de Mandrágora",
                        "subtitle": null,
                        "description": "Partindo da memória coletiva de dois países (Portugal e Noruega), misturou-se a música, a expressão dramática e corporal, o movimento e as marionetas e encontrou-se um compromisso cultural identitário. Um espetáculo icónico onde a abordagem não-verbal ganha forma através da fusão fonética das duas línguas, criando novas palavras e sons, aliada à musicalidade e à linguagem corporal. \"Conchas” conta a história de viajantes, pintados na tela, reais e imaginários, privilegiando os bebés e as suas famílias, porque este público é a semente que germina.\n\nFicha Artística/Técnica\nCoprodução: d’Orfeu AC / Marionetas de Mandrágora\nInterpretação e Manipulação: Joana Martins\nInterpretação e Música: Ricardo Falcão\nEncenação: Filipa Mesquita \nCriação Musical: Manuel Maio e Ricardo Falcão\nApoio à Dramaturgia: Franzisca Aarflot \nMarionetas, cenografia e adereços: enVide nefelibata \nTécnico de iluminação: César Cardoso",
                        "priceList": "Sessões\n22 maio | 16h00 (Público em geral)\n23 maio | 10h00 (Escolas/Instituições)\n\n€6\n€8 bilhete família\n€4 desconto ≤12 anos; ≥65 anos",
                        "language": "59a02bfadf3177197fa5120f",
                        "_id": "62629212ea7bb405c58e3c54"
                    }
                ]
            },
            {
                "_id": "6286230657a037434ac22380",
                "updatedAt": "2022-05-23T14:52:05.007Z",
                "createdAt": "2022-05-19T10:59:18.263Z",
                "createdBy": "5ced662aca84ac489d613a16",
                "ageRange": "Todos os públicos",
                "phone": "239702630",
                "endDate": "2022-05-24T00:00:00.000Z",
                "startDate": "2022-05-24T00:00:00.000Z",
                "highlighted": false,
                "codename": "Visita Guiada",
                "categories": [
                    {
                        "_id": "5a9308371cfd215c85b8706a",
                        "updatedAt": "2019-07-03T11:47:42.380Z",
                        "createdAt": "2018-02-25T19:02:15.663Z",
                        "codename": "Visitas guiadas",
                        "color": "#fc5c65",
                        "order": 11,
                        "image": null,
                        "languageObjects": [
                            {
                                "title": "Visitas guiadas",
                                "language": "59a02bfadf3177197fa5120f",
                                "_id": "5a9308371cfd215c85b8706b"
                            }
                        ],
                        "isMainCategory": true
                    }
                ],
                "place": {
                    "name": "Pátio da Inquisição",
                    "longitude": null,
                    "latitude": null
                },
                "profileImage": {
                    "_id": "6286231157a037434ac22382",
                    "updatedAt": "2022-05-19T10:59:29.092Z",
                    "createdAt": "2022-05-19T10:59:29.092Z",
                    "originalName": "1.JPG"
                },
                "endHour": 1020,
                "startHour": 900,
                "languageObjects": [
                    {
                        "title": "Visita Guiada",
                        "subtitle": "DA INQUISIÇÃO À ABOLIÇÃO DA PENA DE MORTE",
                        "description": "Dia 24 maio | DA INQUISIÇÃO À ABOLIÇÃO DA PENA DE MORTE\nVisita guiada que contextualiza, através de aspetos histórico-artísticos, espaços da cidade ligados à Santa Inquisição e suas ações. \nCusto da visita: Gratuito \nPonto de encontro: Pátio da Inquisição\nItinerário: Praça 8 de Maio, Rua Nova, Rua Corpo de Deus, Praça do Comércio.\n\nINFORMAÇÕES GERAIS | CONDIÇÕES DE ACESSO\n1. As visitas só se realizam com um mínimo de 6 e um máximo de 25 participantes [com exceção da visita Irmã Lúcia e a Rota Carmelita: mínimo de 6 pessoas e máximo de 20 pessoas];\n2. As inscrições são obrigatórias, via telefónica (239702630) ou presencial, na Divisão de Cultura e Promoção Turística [Casa Municipal da Cultura | Rua Pedro Monteiro]\n3. As visitas têm início às 15h00;\n4. Todas as entradas pagas são da responsabilidade dos participantes sendo, para tal, devidamente informados para o efeito.\nNOTA: Todos os circuitos poderão ser alvo de ajustes pontuais nos seus itinerários.",
                        "priceList": "Entrada livre (inscrição prévia)",
                        "language": "59a02bfadf3177197fa5120f",
                        "_id": "6286230657a037434ac22381"
                    }
                ]
            },
            {
                "_id": "628b6d1957a037434ac2238f",
                "updatedAt": "2022-05-23T11:24:30.677Z",
                "createdAt": "2022-05-23T11:16:41.822Z",
                "createdBy": "5ced662aca84ac489d613a16",
                "ageRange": "Todos os públicos",
                "endDate": "2022-05-24T00:00:00.000Z",
                "startDate": "2022-05-24T00:00:00.000Z",
                "highlighted": false,
                "codename": "Receção à Equipa Sénior Feminina de Futsal da AAC",
                "categories": [
                    {
                        "_id": "59c5246b64d7361779be767e",
                        "updatedAt": "2019-07-03T11:47:42.373Z",
                        "createdAt": "2017-09-22T14:55:39.829Z",
                        "codename": "Desporto",
                        "color": "#a55eea",
                        "order": 9,
                        "image": "5b87f904001ccf7ba801fae9",
                        "languageObjects": [
                            {
                                "title": "Desporto",
                                "language": "59a02bfadf3177197fa5120f",
                                "_id": "59c5246b64d7361779be767f"
                            }
                        ],
                        "isMainCategory": true
                    }
                ],
                "place": {
                    "name": "Salão Nobre da Câmara Municipal de Coimbra",
                    "longitude": null,
                    "latitude": null
                },
                "profileImage": {
                    "_id": "628b6d1c57a037434ac22391",
                    "updatedAt": "2022-05-23T11:16:44.615Z",
                    "createdAt": "2022-05-23T11:16:44.615Z",
                    "originalName": "280312965_3197089210571148_3374424855874141411_n.jpg"
                },
                "endHour": 1140,
                "startHour": 1080,
                "languageObjects": [
                    {
                        "title": "Receção à Equipa Sénior Feminina de Futsal da AAC",
                        "subtitle": null,
                        "description": "Receção à Equipa Sénior Feminina da Secção de Futsal da Associação Académica de Coimbra (AAC), para felicitar a subida da equipa à 1ª Divisão Nacional,  a realizar-se amanhã, dia 24 de maio, pelas 18h00, no Salão Nobre da Câmara Municipal de Coimbra. \n\nA receção vai contar com a presença do presidente da CM de Coimbra, José Manuel Silva, do vereador com o Pelouro do Desporto, Carlos Lopes, bem como das atletas, da equipa técnica e da Direção.",
                        "priceList": "Entrada livre",
                        "language": "59a02bfadf3177197fa5120f",
                        "_id": "628b6d1957a037434ac22390"
                    }
                ]
            }
        ],
        "total": 53,
        "limit": 3,
        "page": 1,
        "pages": 18
    }
}
```
